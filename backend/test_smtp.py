import smtplib, ssl

context = ssl.create_default_context()
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE

try:
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as s:
        s.login('moulayabderrahman47@gmail.com', 'ffzqbpznfxlbrnbv')
        print('Connexion OK !')
except Exception as e:
    print('ERREUR:', e)