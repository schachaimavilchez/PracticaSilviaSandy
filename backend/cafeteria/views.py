from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta

from .models import Usuario, Producto, Pedido, ItemPedido, Pago, QRToken
from .serializers import (
    UsuarioSerializer, ProductoSerializer, PedidoSerializer,
    CrearPedidoSerializer, PagoSerializer, QRTokenSerializer,
    ItemPedidoSerializer, GuardarTarjetaSerializer
)


# ─── Permiso personalizado: empleados y admins ────────────────────────────────
class IsEmpleadoOrAdmin(permissions.BasePermission):
    """Permite acceso a usuarios con rol='empleado' o is_staff=True."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_staff or request.user.rol == 'empleado')
        )


# ─── AUTH ─────────────────────────────────────────────────────────────────────
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
                'user':    UsuarioSerializer(user, context={'request': request}).data
            })
        return Response({'error': 'Credenciales incorrectas'}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Si viene rol=empleado, validamos que venga id_empleado
        rol = request.data.get('rol', 'alumno')
        if rol == 'empleado' and not request.data.get('id_empleado', '').strip():
            return Response(
                {'id_empleado': ['El ID de empleado es obligatorio para empleados.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'access':  str(refresh.access_token),
                'refresh': str(refresh),
                'user':    UsuarioSerializer(user, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── USUARIOS ────────────────────────────────────────────────────────────────
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset         = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        return Response(UsuarioSerializer(request.user, context={'request': request}).data)

    @action(detail=False, methods=['post'], url_path='guardar-tarjeta')
    def guardar_tarjeta(self, request):
        """Guarda los últimos 4 dígitos de la tarjeta del usuario."""
        serializer = GuardarTarjetaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.update(request.user, serializer.validated_data)
            return Response({
                'mensaje': 'Tarjeta guardada correctamente',
                'tarjeta': UsuarioSerializer(request.user).data.get('tarjeta')
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── PRODUCTOS ────────────────────────────────────────────────────────────────
class ProductoViewSet(viewsets.ModelViewSet):
    queryset         = Producto.objects.all()
    serializer_class = ProductoSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and (user.is_staff or user.rol == 'empleado'):
            return Producto.objects.all()
        return Producto.objects.filter(disponible=True)

    def get_permissions(self):
        # Lectura: cualquier usuario autenticado
        # Escritura (crear/editar/borrar): empleados Y admins
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsEmpleadoOrAdmin()]
        return [permissions.IsAuthenticated()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


# ─── PEDIDOS ─────────────────────────────────────────────────────────────────
class PedidoViewSet(viewsets.ModelViewSet):
    queryset         = Pedido.objects.all()
    serializer_class = PedidoSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.rol == 'empleado':
            return Pedido.objects.all().order_by('-creado')
        return Pedido.objects.filter(usuario=user).order_by('-creado')

    @transaction.atomic
    def create(self, request):
        serializer = CrearPedidoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        items_data = serializer.validated_data['items']

        pedido = Pedido.objects.create(usuario=request.user)
        for item_data in items_data:
            producto = Producto.objects.get(id=item_data['producto_id'])
            ItemPedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=item_data['cantidad'],
                precio_unitario=producto.precio
            )
        pedido.calcular_total()
        return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='cambiar_estado')
    def cambiar_estado(self, request, pk=None):
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')
        estados_validos = [e[0] for e in Pedido.ESTADOS]
        if nuevo_estado not in estados_validos:
            return Response({'error': f'Estado no válido. Opciones: {estados_validos}'}, status=400)
        pedido.estado = nuevo_estado
        pedido.save()
        return Response(PedidoSerializer(pedido).data)


# ─── PAGOS ───────────────────────────────────────────────────────────────────
class PagoViewSet(viewsets.ModelViewSet):
    queryset         = Pago.objects.all()
    serializer_class = PagoSerializer

    @transaction.atomic
    def create(self, request):
        pedido_id = request.data.get('pedido')
        metodo    = request.data.get('metodo', 'tarjeta')

        try:
            pedido = Pedido.objects.get(id=pedido_id, usuario=request.user)
        except Pedido.DoesNotExist:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if pedido.estado != 'pendiente':
            return Response({'error': 'El pedido ya fue procesado'}, status=status.HTTP_400_BAD_REQUEST)

        # Pago con saldo interno
        if metodo == 'saldo':
            if request.user.saldo < pedido.total:
                return Response(
                    {'error': f'Saldo insuficiente. Tienes {request.user.saldo}€'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            request.user.saldo -= pedido.total
            request.user.save()

        # Para 'guardada' y 'nueva' se asume que el cobro real lo gestiona Redsys/TPV externo
        # Aquí registramos el pago y cambiamos el estado
        Pago.objects.create(pedido=pedido, metodo=metodo, monto=pedido.total)
        pedido.estado = 'pagado'
        pedido.save()

        # Generamos el QR de recogida
        qr, _ = QRToken.objects.get_or_create(pedido=pedido)

        return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)


# ─── PAGO DIRECTO (endpoint que usa el frontend: api.pagar) ──────────────────
class PagarPedidoView(APIView):
    """
    POST /api/pedidos/{id}/pagar/
    Body: { "metodo": "guardada" | "nueva" | "saldo" }
    Crea el Pago, actualiza el estado y genera el QR.
    """
    @transaction.atomic
    def post(self, request, pedido_id):
        metodo = request.data.get('metodo', 'guardada')

        try:
            pedido = Pedido.objects.get(id=pedido_id, usuario=request.user)
        except Pedido.DoesNotExist:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if pedido.estado != 'pendiente':
            return Response({'error': 'El pedido ya fue procesado'}, status=status.HTTP_400_BAD_REQUEST)

        if metodo == 'saldo':
            if request.user.saldo < pedido.total:
                return Response(
                    {'error': f'Saldo insuficiente. Tienes {float(request.user.saldo):.2f}€'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            request.user.saldo -= pedido.total
            request.user.save()

        Pago.objects.create(pedido=pedido, metodo=metodo, monto=pedido.total)
        pedido.estado = 'pagado'
        pedido.save()
        QRToken.objects.get_or_create(pedido=pedido)

        return Response(PedidoSerializer(pedido).data, status=status.HTTP_200_OK)


# ─── VALIDAR QR ──────────────────────────────────────────────────────────────
class ValidarQRView(APIView):
    permission_classes = [IsEmpleadoOrAdmin]

    def post(self, request):
        codigo = request.data.get('codigo', '').strip().upper()
        if not codigo:
            return Response({'error': 'Código requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            qr = QRToken.objects.select_related('pedido', 'pedido__usuario').get(codigo=codigo)
            if qr.usado:
                return Response({'error': 'Este código ya fue usado', 'estado': 'ya_entregado'}, status=400)
            qr.usado = True
            qr.save()
            qr.pedido.estado = 'entregado'
            qr.pedido.save()
            return Response({
                'mensaje':  'Pedido entregado correctamente',
                'pedido_id': qr.pedido.id,
                'alumno':   qr.pedido.usuario.get_full_name() or qr.pedido.usuario.username,
                'estado':   'entregado'
            })
        except QRToken.DoesNotExist:
            return Response({'error': 'Código QR no válido'}, status=status.HTTP_404_NOT_FOUND)


# ─── ESTADÍSTICAS (F7) ───────────────────────────────────────────────────────
class EstadisticasView(APIView):
    """
    GET /api/estadisticas/
    Params opcionales: fecha_inicio=YYYY-MM-DD & fecha_fin=YYYY-MM-DD
    Devuelve: ventas totales, pedidos por estado, top productos, ingresos diarios.
    """
    permission_classes = [IsEmpleadoOrAdmin]

    def get(self, request):
        # ── Filtro por fechas ──
        fecha_inicio_str = request.query_params.get('fecha_inicio')
        fecha_fin_str    = request.query_params.get('fecha_fin')

        qs = Pedido.objects.filter(estado__in=['pagado', 'listo', 'entregado'])

        if fecha_inicio_str:
            fecha_inicio = parse_date(fecha_inicio_str)
            if fecha_inicio:
                qs = qs.filter(creado__date__gte=fecha_inicio)

        if fecha_fin_str:
            fecha_fin = parse_date(fecha_fin_str)
            if fecha_fin:
                qs = qs.filter(creado__date__lte=fecha_fin)

        # ── Métricas globales ──
        total_ventas  = qs.aggregate(total=Sum('total'))['total'] or 0
        total_pedidos = qs.count()
        ticket_medio  = float(total_ventas) / total_pedidos if total_pedidos > 0 else 0

        # ── Pedidos por estado (todos los estados) ──
        pedidos_por_estado = list(
            Pedido.objects.values('estado')
            .annotate(cantidad=Count('id'))
            .order_by('estado')
        )

        # ── Top 5 productos más vendidos ──
        from django.db.models import F
        top_productos = list(
            ItemPedido.objects.filter(pedido__in=qs)
            .values('producto__nombre')
            .annotate(total_vendido=Sum('cantidad'))
            .order_by('-total_vendido')[:5]
        )

        # ── Ingresos por día (últimos 30 días o rango seleccionado) ──
        from django.db.models.functions import TruncDate
        ingresos_diarios = list(
            qs.annotate(dia=TruncDate('creado'))
            .values('dia')
            .annotate(total=Sum('total'), pedidos=Count('id'))
            .order_by('dia')
        )
        # Convertimos las fechas a string para JSON
        for row in ingresos_diarios:
            row['dia'] = str(row['dia'])

        return Response({
            'resumen': {
                'total_ventas':   float(total_ventas),
                'total_pedidos':  total_pedidos,
                'ticket_medio':   round(ticket_medio, 2),
                'total_productos': Producto.objects.count(),
            },
            'pedidos_por_estado': pedidos_por_estado,
            'top_productos':      top_productos,
            'ingresos_diarios':   ingresos_diarios,
        })
