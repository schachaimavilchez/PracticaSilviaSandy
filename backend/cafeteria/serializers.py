from rest_framework import serializers
from .models import Usuario, Producto, Pedido, ItemPedido, Pago, QRToken


class TarjetaSerializer(serializers.Serializer):
    """Datos de tarjeta guardada para mostrar en el frontend (sin datos sensibles)."""
    numero  = serializers.SerializerMethodField()
    titular = serializers.CharField(source='tarjeta_titular')
    expiry  = serializers.CharField(source='tarjeta_expiry')

    def get_numero(self, obj):
        if obj.tarjeta_numero:
            return f"**** **** **** {obj.tarjeta_numero}"
        return None


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    # Campo opcional solo en registro de empleado
    id_empleado = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    # Tarjeta guardada anidada (solo lectura)
    tarjeta = serializers.SerializerMethodField()

    class Meta:
        model  = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'saldo', 'password', 'id_empleado', 'tarjeta'
        ]
        read_only_fields = ['id', 'saldo']

    def get_tarjeta(self, obj):
        if obj.tarjeta_numero:
            return {
                'numero':  f"**** **** **** {obj.tarjeta_numero}",
                'titular': obj.tarjeta_titular or obj.get_full_name() or obj.username,
                'expiry':  obj.tarjeta_expiry or '',
            }
        return None

    def create(self, validated_data):
        # Extraemos el rol y el id_empleado antes de crear el usuario
        rol         = validated_data.pop('rol', 'alumno')
        id_empleado = validated_data.pop('id_empleado', None)
        user = Usuario.objects.create_user(**validated_data)
        user.rol = rol
        if id_empleado:
            user.id_empleado = id_empleado
        user.save()
        return user


class ProductoSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model  = Producto
        fields = '__all__'

    def get_imagen_url(self, obj):
        if obj.imagen:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.imagen.url) if request else obj.imagen.url
        return None


class QRTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model  = QRToken
        fields = ['codigo', 'usado', 'creado', 'pedido']
        read_only_fields = ['codigo', 'creado']


class ItemPedidoSerializer(serializers.ModelSerializer):
    nombre_producto = serializers.ReadOnlyField(source='producto.nombre')
    subtotal        = serializers.SerializerMethodField()

    class Meta:
        model  = ItemPedido
        fields = ['id', 'producto', 'nombre_producto', 'cantidad', 'precio_unitario', 'subtotal']

    def get_subtotal(self, obj):
        return float(obj.subtotal())


class PedidoSerializer(serializers.ModelSerializer):
    items          = ItemPedidoSerializer(many=True, read_only=True)
    nombre_usuario = serializers.ReadOnlyField(source='usuario.get_full_name')
    codigo_qr      = serializers.SerializerMethodField()
    qr_token       = serializers.SerializerMethodField()

    class Meta:
        model  = Pedido
        fields = [
            'id', 'usuario', 'nombre_usuario', 'estado', 'total',
            'items', 'creado', 'actualizado', 'codigo_qr', 'qr_token'
        ]
        read_only_fields = ['id', 'total', 'creado', 'actualizado', 'usuario']

    def get_codigo_qr(self, obj):
        try:
            return obj.qr.codigo
        except QRToken.DoesNotExist:
            return None

    def get_qr_token(self, obj):
        """Devuelve el objeto QR completo para que el frontend pueda usarlo directamente."""
        try:
            qr = obj.qr
            return {'codigo': qr.codigo, 'usado': qr.usado}
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
        model  = Pago
        fields = '__all__'
        read_only_fields = ['id', 'realizado']


class GuardarTarjetaSerializer(serializers.Serializer):
    """Para guardar los últimos 4 dígitos de una tarjeta (nunca el número completo)."""
    numero_completo = serializers.CharField(max_length=19)
    titular         = serializers.CharField(max_length=100)
    expiry          = serializers.CharField(max_length=5)

    def validate_numero_completo(self, value):
        digits = value.replace(' ', '').replace('-', '')
        if not digits.isdigit() or len(digits) < 13:
            raise serializers.ValidationError("Número de tarjeta inválido")
        return digits[-4:]  # Solo guardamos los últimos 4

    def update(self, instance, validated_data):
        instance.tarjeta_numero  = validated_data['numero_completo']  # Ya son los últimos 4
        instance.tarjeta_titular = validated_data['titular']
        instance.tarjeta_expiry  = validated_data['expiry']
        instance.save()
        return instance