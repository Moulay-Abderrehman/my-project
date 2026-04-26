from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['utilisateur', 'type', 'est_lue', 'date_creation']
    list_filter = ['type', 'est_lue']
    search_fields = ['utilisateur__telephone', 'message']