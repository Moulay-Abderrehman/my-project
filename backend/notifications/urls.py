from django.urls import path
from .views import (
    NotificationListView,
    MarquerLueView,
    MarquerToutesLuesView,
    NombreNonLuesView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notifications'),
    path('<uuid:pk>/lue/', MarquerLueView.as_view(), name='notification-lue'),
    path('toutes-lues/', MarquerToutesLuesView.as_view(), name='toutes-lues'),
    path('non-lues/', NombreNonLuesView.as_view(), name='non-lues'),
]