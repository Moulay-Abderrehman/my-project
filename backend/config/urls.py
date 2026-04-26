from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView  # <-- IMPORTANT

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/comptes/', include('comptes.urls')),
    path('api/abonnements/', include('abonnements.urls')),
    path('api/transactions/', include('transactions.urls')),
    path('api/budgets/', include('budgets.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/logs/', include('logs.urls')),
    # ─── AJOUTER CETTE LIGNE pour le refresh token ───
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] 
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


#+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

