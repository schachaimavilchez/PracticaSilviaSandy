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
    # CORRECCIÓN: Se añade el queryset base
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    def get_queryset(self):
        user = self.request.user
        # Admin y empleados ven todo, alumnos solo disponibles
        if user.is_authenticated and (user.is_staff or user.rol == 'empleado'):
            return Producto.objects.all()
        return Producto.objects.filter(disponible=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

class PedidoViewSet(viewsets.ModelViewSet):
    # CORRECCIÓN: Se añade el queryset base
    queryset = Pedido.objects.all()
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

        if metodo == 'saldo':
            if request.user.saldo < pedido.total:
                return Response({'error': f'Saldo insuficiente. Tienes {request.user.saldo}€'}, status=400)
            request.user.saldo -= pedido.total
            request.user.save()

        pago = Pago.objects.create(pedido=pedido, metodo=metodo, monto=pedido.total)
        pedido.estado = 'pagado'
        pedido.save()
        QRToken.objects.create(pedido=pedido)

        return Response(PedidoSerializer(pedido).data, status=status.HTTP_201_CREATED)

class ValidarQRView(APIView):
    def post(self, request):
        codigo = request.data.get('codigo', '').upper()
        try:
            qr = QRToken.objects.get(codigo=codigo)
            if qr.usado:
                return Response({'mensaje': 'Código ya usado'}, status=400)
            qr.usado = True
            qr.save()
            qr.pedido.estado = 'entregado'
            qr.pedido.save()
            return Response({'mensaje': 'Pedido entregado'})
        except QRToken.DoesNotExist:
            return Response({'mensaje': 'QR no válido'}, status=404)
