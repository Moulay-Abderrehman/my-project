from django.urls import path
from .views import (
    NotificationListView,
    MarquerLueView,
    MarquerToutesLuesView,
    NombreNonLuesView,
    SupprimerNotificationView,
    SupprimerToutesNotificationsView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications'),
    path('<uuid:pk>/lue/', MarquerLueView.as_view(), name='notification-lue'),
    path('toutes-lues/', MarquerToutesLuesView.as_view(), name='toutes-lues'),
    path('non-lues/', NombreNonLuesView.as_view(), name='non-lues'),
    # Supprimer une notification spécifique
    path('<uuid:pk>/', SupprimerNotificationView.as_view(), name='supprimer-notification'),
    
    # Supprimer toutes les notifications
    path('supprimer-toutes/', SupprimerToutesNotificationsView.as_view(), name='supprimer-toutes'),
]