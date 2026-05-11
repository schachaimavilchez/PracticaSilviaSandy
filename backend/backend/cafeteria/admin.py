from django.contrib import admin
from .models import Usuario, Producto, Pedido, ItemPedido, Pago, QRToken

admin.site.register(Usuario)
admin.site.register(Producto)
admin.site.register(Pedido)
admin.site.register(ItemPedido)
admin.site.register(Pago)
admin.site.register(QRToken)
