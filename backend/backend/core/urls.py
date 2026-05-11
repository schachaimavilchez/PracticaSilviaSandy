from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from cafeteria.views import (
    LoginView, RegisterView, UsuarioViewSet,
    ProductoViewSet, PedidoViewSet, PagoViewSet,
    ValidarQRView, EstadisticasView, PagarPedidoView,
    GoogleLoginRedirectView, GoogleCallbackView,
    RedsysNotificacionView,
)

router = DefaultRouter()
router.register('usuarios',  UsuarioViewSet)
router.register('productos', ProductoViewSet)
router.register('pedidos',   PedidoViewSet, basename='pedidos')
router.register('pagos',     PagoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth normal
    path('api/auth/login/',    LoginView.as_view()),
    path('api/auth/register/', RegisterView.as_view()),
    path('api/auth/refresh/',  TokenRefreshView.as_view()),

    # Google SSO
    path('api/auth/google/',          GoogleLoginRedirectView.as_view()),
    path('api/auth/google/callback/', GoogleCallbackView.as_view()),

    # Redsys IPN simulada
    path('api/redsys/notificacion/',  RedsysNotificacionView.as_view()),

    # QR, estadísticas y pago directo
    path('api/qr/validar/',                    ValidarQRView.as_view()),
    path('api/estadisticas/',                  EstadisticasView.as_view()),
    path('api/pedidos/<int:pedido_id>/pagar/', PagarPedidoView.as_view()),

    # Router
    path('api/', include(router.urls)),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)