from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from django.db.models import Sum, Count
from django.utils.dateparse import parse_date
from django.shortcuts import redirect
from django.conf import settings

import requests
import urllib.parse

from .models import Usuario, Producto, Pedido, ItemPedido, Pago, QRToken
from .serializers import (
    UsuarioSerializer, ProductoSerializer, PedidoSerializer,
    CrearPedidoSerializer, PagoSerializer, QRTokenSerializer,
    ItemPedidoSerializer, GuardarTarjetaSerializer
)


# ─── Permiso personalizado ────────────────────────────────────────────────────
class IsEmpleadoOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.is_staff or request.user.rol == 'empleado')
        )


# ─── AUTH NORMAL ──────────────────────────────────────────────────────────────
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


# ─── GOOGLE SSO ───────────────────────────────────────────────────────────────
class GoogleLoginRedirectView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        params = {
            'client_id':     settings.GOOGLE_CLIENT_ID,
            'redirect_uri':  settings.GOOGLE_REDIRECT_URI,
            'response_type': 'code',
            'scope':         'openid email profile',
            'access_type':   'offline',
            'prompt':        'select_account',
        }
        url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params)
        return redirect(url)


class GoogleCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        code = request.GET.get('code')
        if not code:
            return redirect(f"{settings.FRONTEND_URL}/?error=google_auth_failed")

        token_resp = requests.post('https://oauth2.googleapis.com/token', data={
            'code':          code,
            'client_id':     settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri':  settings.GOOGLE_REDIRECT_URI,
            'grant_type':    'authorization_code',
        })

        if not token_resp.ok:
            return redirect(f"{settings.FRONTEND_URL}/?error=google_token_failed")

        access_token = token_resp.json().get('access_token')

        userinfo_resp = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )

        if not userinfo_resp.ok:
            return redirect(f"{settings.FRONTEND_URL}/?error=google_userinfo_failed")

        info       = userinfo_resp.json()
        email      = info.get('email')
        first_name = info.get('given_name', '')
        last_name  = info.get('family_name', '')
        google_id  = info.get('sub')

        if not email:
            return redirect(f"{settings.FRONTEND_URL}/?error=no_email")

        user, created = Usuario.objects.get_or_create(
            email=email,
            defaults={
                'username':   email.split('@')[0],
                'first_name': first_name,
                'last_name':  last_name,
                'rol':        'alumno',
            }
        )

        if created:
            base = email.split('@')[0]
            if Usuario.objects.filter(username=base).exclude(pk=user.pk).exists():
                user.username = f"{base}_{google_id[:6]}"
                user.save()

        refresh = RefreshToken.for_user(user)
        params  = urllib.parse.urlencode({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
        })
        return redirect(f"{settings.FRONTEND_URL}/google-callback?{params}")


# ─── REDSYS IPN SIMULADA ─────────────────────────────────────────────────────
class RedsysNotificacionView(APIView):
    """
    POST /api/redsys/notificacion/
    Simula la notificación IPN que Redsys envía al backend tras un pago.
    En un entorno real, este endpoint lo llamaría el servidor de Redsys
    con una firma HMAC-SHA256 para verificar la autenticidad.
    Aquí lo llama el frontend directamente tras la confirmación del usuario.
    ds_response '0000' = pago autorizado.
    """
    @transaction.atomic
    def post(self, request):
        pedido_id   = request.data.get('pedido_id')
        ds_response = str(request.data.get('ds_response', '9999'))

        # Código de respuesta Redsys: 0000-0099 = autorizado
        try:
            codigo = int(ds_response)
            autorizado = 0 <= codigo <= 99
        except (ValueError, TypeError):
            autorizado = False

        if not autorizado:
            return Response(
                {'error': f'Pago rechazado por Redsys (código {ds_response})'},
                status=status.HTTP_402_PAYMENT_REQUIRED
            )

        try:
            pedido = Pedido.objects.get(id=pedido_id)
        except Pedido.DoesNotExist:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if pedido.estado != 'pendiente':
            # Ya fue procesado — devolvemos el estado actual sin error
            qr = getattr(pedido, 'qr', None)
            return Response({
                **PedidoSerializer(pedido).data,
                'codigo_qr':     qr.codigo if qr else None,
                'nombre_usuario': pedido.usuario.get_full_name() or pedido.usuario.username,
            })

        # Registrar el pago
        Pago.objects.create(pedido=pedido, metodo='redsys', monto=pedido.total)
        pedido.estado = 'pagado'
        pedido.save()

        # Generar QR de recogida
        qr, _ = QRToken.objects.get_or_create(pedido=pedido)

        data = PedidoSerializer(pedido).data
        data['nombre_usuario'] = pedido.usuario.get_full_name() or pedido.usuario.username
        return Response(data, status=status.HTTP_200_OK)


# ─── USUARIOS ────────────────────────────────────────────────────────────────
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset         = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        return Response(UsuarioSerializer(request.user, context={'request': request}).data)

    @action(detail=False, methods=['post'], url_path='guardar-tarjeta')
    def guardar_tarjeta(self, request):
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
        if metodo == 'saldo':
            if request.user.saldo < pedido.total:
                return Response({'error': f'Saldo insuficiente. Tienes {request.user.saldo}€'}, status=400)
            request.user.saldo -= pedido.total
            request.user.save()
        Pago.objects.create(pedido=pedido, metodo=metodo, monto=pedido.total)
        pedido.estado = 'pagado'
        pedido.save()
        QRToken.objects.get_or_create(pedido=pedido)
        return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)


# ─── PAGAR PEDIDO DIRECTO ────────────────────────────────────────────────────
class PagarPedidoView(APIView):
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
                return Response({'error': f'Saldo insuficiente. Tienes {float(request.user.saldo):.2f}€'}, status=400)
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
                'mensaje':   'Pedido entregado correctamente',
                'pedido_id': qr.pedido.id,
                'alumno':    qr.pedido.usuario.get_full_name() or qr.pedido.usuario.username,
                'estado':    'entregado'
            })
        except QRToken.DoesNotExist:
            return Response({'error': 'Código QR no válido'}, status=status.HTTP_404_NOT_FOUND)


# ─── ESTADÍSTICAS ────────────────────────────────────────────────────────────
class EstadisticasView(APIView):
    permission_classes = [IsEmpleadoOrAdmin]

    def get(self, request):
        fecha_inicio_str = request.query_params.get('fecha_inicio')
        fecha_fin_str    = request.query_params.get('fecha_fin')
        qs = Pedido.objects.filter(estado__in=['pagado', 'listo', 'entregado'])
        if fecha_inicio_str:
            fi = parse_date(fecha_inicio_str)
            if fi: qs = qs.filter(creado__date__gte=fi)
        if fecha_fin_str:
            ff = parse_date(fecha_fin_str)
            if ff: qs = qs.filter(creado__date__lte=ff)

        total_ventas  = qs.aggregate(total=Sum('total'))['total'] or 0
        total_pedidos = qs.count()
        ticket_medio  = float(total_ventas) / total_pedidos if total_pedidos > 0 else 0

        pedidos_por_estado = list(
            Pedido.objects.values('estado').annotate(cantidad=Count('id')).order_by('estado')
        )
        top_productos = list(
            ItemPedido.objects.filter(pedido__in=qs)
            .values('producto__nombre')
            .annotate(total_vendido=Sum('cantidad'))
            .order_by('-total_vendido')[:5]
        )
        from django.db.models.functions import TruncDate
        ingresos_diarios = list(
            qs.annotate(dia=TruncDate('creado'))
            .values('dia').annotate(total=Sum('total'), pedidos=Count('id'))
            .order_by('dia')
        )
        for row in ingresos_diarios:
            row['dia'] = str(row['dia'])

        return Response({
            'resumen': {
                'total_ventas':    float(total_ventas),
                'total_pedidos':   total_pedidos,
                'ticket_medio':    round(ticket_medio, 2),
                'total_productos': Producto.objects.count(),
            },
            'pedidos_por_estado': pedidos_por_estado,
            'top_productos':      top_productos,
            'ingresos_diarios':   ingresos_diarios,
        })