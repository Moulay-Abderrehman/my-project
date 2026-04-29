import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.mail import send_mail

try:
    send_mail(
        subject='Test FinanceApp',
        message='Si tu reçois cet email, Django envoie correctement !',
        from_email='FinanceApp <moulayabderrahman47@gmail.com>',
        recipient_list=['moulayabdrehman73@gmail.com'],
        fail_silently=False,
    )
    print('Email envoyé avec succès !')
except Exception as e:
    print(f'ERREUR: {e}')

