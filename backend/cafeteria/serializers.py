from rest_framework import serializers
from .models import Usuario, Producto, Pedido, ItemPedido, Pago, QRToken

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'saldo', 'password']
        read_only_fields = ['id', 'saldo']

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)

class ProductoSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = '__all__'

    def get_imagen_url(self, obj):
        if obj.imagen:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.imagen.url) if request else obj.imagen.url
        return None

class ItemPedidoSerializer(serializers.ModelSerializer):
    nombre_producto = serializers.ReadOnlyField(source='producto.nombre')
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = ItemPedido
        fields = ['id', 'producto', 'nombre_producto', 'cantidad', 'precio_unitario', 'subtotal']

    def get_subtotal(self, obj):
        return float(obj.subtotal())

class PedidoSerializer(serializers.ModelSerializer):
    items = ItemPedidoSerializer(many=True, read_only=True)
    nombre_usuario = serializers.ReadOnlyField(source='usuario.get_full_name')
    codigo_qr = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = ['id', 'usuario', 'nombre_usuario', 'estado', 'total', 'items', 'creado', 'actualizado', 'codigo_qr']
        read_only_fields = ['id', 'total', 'creado', 'actualizado', 'usuario']

    def get_codigo_qr(self, obj):
        try:
            return obj.qr.codigo
        except QRToken.DoesNotExist:
            return None

class CrearPedidoSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.DictField())

    def validate_items(self, value):
        for item in value:
            if 'producto_id' not in item or 'cantidad' not in item:
                raise serializers.ValidationError("Cada item necesita producto_id y cantidad")
            if not Producto.objects.filter(id=item['producto_id'], disponible=True).exists():
                raise serializers.ValidationError(f"Producto {item.get('producto_id')} no disponible")
        return value

class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        fields = '__all__'
        read_only_fields = ['id', 'realizado']

class QRTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRToken
        fields = ['codigo', 'usado', 'creado', 'pedido']
        read_only_fields = ['codigo', 'creado']