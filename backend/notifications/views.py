from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status
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
    

# ════════════════════════════════════════════════════════════════════════
# NOUVELLE VUE POUR LA SUPPRESSION
# ════════════════════════════════════════════════════════════════════════
class SupprimerNotificationView(APIView):
    """Supprime une notification spécifique."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            notif = Notification.objects.get(id=pk, utilisateur=request.user)
            notif.delete()
            return Response({'message': 'Notification supprimée avec succès.'}, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification introuvable.'}, status=status.HTTP_404_NOT_FOUND)


class SupprimerToutesNotificationsView(APIView):
    """Supprime toutes les notifications de l'utilisateur."""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        count = Notification.objects.filter(utilisateur=request.user).count()
        Notification.objects.filter(utilisateur=request.user).delete()
        return Response({
            'message': f'{count} notification(s) supprimée(s) avec succès.'
        }, status=status.HTTP_200_OK)

