from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid, string, random


class Usuario(AbstractUser):
    ROLES = [('alumno', 'Alumno'), ('empleado', 'Empleado')]
    rol        = models.CharField(max_length=20, choices=ROLES, default='alumno')
    saldo      = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    id_empleado = models.CharField(max_length=20, blank=True, null=True, unique=True,
                                   help_text="Código único de empleado (ej: EMP-0001)")

    # Tarjeta guardada (últimos 4 dígitos, titular y caducidad — nunca datos sensibles completos)
    tarjeta_numero  = models.CharField(max_length=4, blank=True, null=True,
                                       help_text="Últimos 4 dígitos de la tarjeta guardada")
    tarjeta_titular = models.CharField(max_length=100, blank=True, null=True)
    tarjeta_expiry  = models.CharField(max_length=5, blank=True, null=True,
                                       help_text="Caducidad MM/AA")

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='cafeteria_user_groups',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='cafeteria_user_permissions',
        blank=True
    )

    class Meta:
        verbose_name = 'Usuario'

    def __str__(self):
        return f"{self.username} ({self.rol})"


class Producto(models.Model):
    nombre      = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio      = models.DecimalField(max_digits=6, decimal_places=2)
    imagen      = models.ImageField(upload_to='productos/', blank=True, null=True)
    disponible  = models.BooleanField(default=True)
    stock       = models.IntegerField(default=100)
    creado      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre


class Pedido(models.Model):
    ESTADOS = [
        ('pendiente',  'Pendiente'),
        ('pagado',     'Pagado'),
        ('listo',      'Listo'),
        ('entregado',  'Entregado'),
        ('cancelado',  'Cancelado'),
    ]
    usuario    = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='pedidos')
    estado     = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    total      = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    creado     = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    def calcular_total(self):
        self.total = sum(item.subtotal() for item in self.items.all())
        self.save()

    def __str__(self):
        return f"Pedido #{self.id} - {self.usuario.username}"


class ItemPedido(models.Model):
    pedido          = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    producto        = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad        = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=6, decimal_places=2)

    def subtotal(self):
        return self.cantidad * self.precio_unitario


class Pago(models.Model):
    METODOS = [
        ('redsys',   'Redsys TPV'),
        ('tarjeta',  'Tarjeta'),
        ('guardada', 'Tarjeta guardada'),
        ('nueva',    'Tarjeta nueva'),
        ('saldo',    'Saldo'),
        ('efectivo', 'Efectivo'),
    ]
    pedido    = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name='pago')
    metodo    = models.CharField(max_length=20, choices=METODOS)
    monto     = models.DecimalField(max_digits=8, decimal_places=2)
    realizado = models.DateTimeField(auto_now_add=True)


class QRToken(models.Model):
    pedido  = models.OneToOneField(Pedido, on_delete=models.CASCADE, related_name='qr')
    codigo  = models.CharField(max_length=10, unique=True)
    usado   = models.BooleanField(default=False)
    creado  = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.codigo:
            chars = string.ascii_uppercase + string.digits
            self.codigo = 'PB' + ''.join(random.choices(chars, k=5))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.codigo
