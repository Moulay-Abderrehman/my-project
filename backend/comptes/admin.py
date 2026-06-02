from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ['telephone', 'nom', 'prenom', 'email', 'is_active', 'is_staff', 'date_inscription']
    list_filter = ['is_active', 'is_staff']
    search_fields = ['telephone', 'nom', 'prenom', 'email']
    ordering = ['-date_inscription']

    fieldsets = (
        (None, {'fields': ('telephone', 'password')}),
        ('Informations personnelles', {'fields': ('nom', 'prenom', 'email', 'photo_profil')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login', 'date_inscription')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('telephone', 'nom', 'prenom', 'email', 'password1', 'password2'),
        }),
    )
    readonly_fields = ['date_inscription', 'last_login']