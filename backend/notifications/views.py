from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(utilisateur=self.request.user)


class MarquerLueView(APIView):
    permission_classes = [IsAuthenticated]
 
    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(id=pk, utilisateur=request.user)
            notif.est_lue = True
            notif.save(update_fields=['est_lue'])
            return Response({'message': 'Notification marquée comme lue.'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification introuvable.'}, status=404)


class MarquerToutesLuesView(APIView):
    permission_classes = [IsAuthenticated]
 
    def patch(self, request):
        Notification.objects.filter(utilisateur=request.user, est_lue=False).update(est_lue=True)
        return Response({'message': 'Toutes les notifications marquées comme lues.'})
         
 
class NombreNonLuesView(APIView):
    """Retourne le nombre de notifications non lues (pour badge navbar)."""
    permission_classes = [IsAuthenticated]
 
    def get(self, request):
        count = Notification.objects.filter(utilisateur=request.user, est_lue=False).count()
        return Response({'non_lues': count})