def enregistrer_log(user, action, details='', request=None):
    """
    Enregistre une entrée dans le journal d'activité.
    Importée et utilisée dans toutes les vues.
    """
    try:
        from .models import Log
        # Vérifier si l'utilisateur est authentifié (évite les erreurs avec AnonymousUser)        
        # Gestion de l'utilisateur anonyme (AnonymousUser)
        if user is None or not getattr(user, 'is_authenticated', False):
            user = None

        # Extraction de l'IP
        ip = None
        if request:
            # Gestion sécurisée de l'adresse IP
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded:
                ip = x_forwarded.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')

        # Création du log
        Log.objects.create(
            utilisateur=user,
            action=action,
            details=details,
            adresse_ip=ip if ip else None,
        )
    except Exception:
        pass # Sécurité :  Les logs ne doivent jamais bloquer l'application