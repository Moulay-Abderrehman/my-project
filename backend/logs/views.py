from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Log
from .serializers import LogSerializer


class LogListView(generics.ListAPIView):
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Log.objects.filter(utilisateur=self.request.user)