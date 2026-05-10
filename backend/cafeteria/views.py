from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db import transaction
from .models import Usuario, Producto, Pedido, ItemPedido, Pago, QRToken
from .serializers import (
    UsuarioSerializer, ProductoSerializer, PedidoSerializer,
    CrearPedidoSerializer, PagoSerializer, QRTokenSerializer, ItemPedidoSerializer
)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UsuarioSerializer(user).data
            })
        return Response({'error': 'Credenciales incorrectas'}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UsuarioSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UsuarioSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        return Response(UsuarioSerializer(request.user).data)


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.filter(disponible=True)
    serializer_class = ProductoSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class PedidoViewSet(viewsets.ModelViewSet):
    serializer_class = PedidoSerializer

    def get_queryset(self):
        user = self.request.user
        if user.rol == 'empleado' or user.is_staff:
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

    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        pedido = self.get_object()
        nuevo_estado = request.data.get('estado')
        estados_validos = [e[0] for e in Pedido.ESTADOS]
        if nuevo_estado not in estados_validos:
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        pedido.estado = nuevo_estado
        pedido.save()
        return Response(PedidoSerializer(pedido).data)


class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.all()
    serializer_class = PagoSerializer

    @transaction.atomic
    def create(self, request):
        pedido_id = request.data.get('pedido')
        metodo = request.data.get('metodo', 'tarjeta')
        try:
            pedido = Pedido.objects.get(id=pedido_id, usuario=request.user)
        except Pedido.DoesNotExist:
            return Response({'error': 'Pedido no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if pedido.estado != 'pendiente':
            return Response({'error': 'El pedido ya fue pagado'}, status=status.HTTP_400_BAD_REQUEST)

        pago = Pago.objects.create(pedido=pedido, metodo=metodo, monto=pedido.total)
        pedido.estado = 'pagado'
        pedido.save()
        qr = QRToken.objects.create(pedido=pedido)

        return Response({
            'pago': PagoSerializer(pago).data,
            'qr': QRTokenSerializer(qr).data,
            'pedido': PedidoSerializer(pedido).data
        }, status=status.HTTP_201_CREATED)


class ValidarQRView(APIView):
    def post(self, request):
        codigo = request.data.get('codigo', '').upper()
        try:
            qr = QRToken.objects.get(codigo=codigo)
        except QRToken.DoesNotExist:
            return Response({'valido': False, 'mensaje': 'Código no encontrado'}, status=404)

        if qr.usado:
            return Response({'valido': False, 'mensaje': 'Código ya utilizado'})

        qr.usado = True
        qr.save()
        qr.pedido.estado = 'entregado'
        qr.pedido.save()

        return Response({
            'valido': True,
            'pedido': PedidoSerializer(qr.pedido).data,
            'mensaje': 'Pedido entregado correctamente'
        })
