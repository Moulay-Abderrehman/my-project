from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'est_lue', 'date_creation']
        read_only_fields = ['id', 'date_creation']