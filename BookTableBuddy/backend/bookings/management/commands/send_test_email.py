from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import time
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

class Command(BaseCommand):
    help = 'Send a test email to verify email configuration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--recipient',
            dest='recipient',
            help='Email address to send test email to',
            required=True,
        )

    def handle(self, *args, **options):
        recipient = options['recipient']
        
        self.stdout.write(self.style.SUCCESS(f"Starting email test to {recipient}"))
        self.stdout.write(f"Email settings: HOST={settings.EMAIL_HOST}, PORT={settings.EMAIL_PORT}")
        self.stdout.write(f"Using email account: {settings.EMAIL_HOST_USER}")
        
        # Plain text version
        plain_message = (
            "Hello from BookTableBuddy!\n\n"
            "This is a test email to verify your email configuration is working.\n\n"
            "If you're receiving this, your email setup is successful!\n\n"
            "Regards,\nBookTableBuddy Team"
        )
        
        # HTML version for better deliverability
        html_message = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #e53935; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .footer {{ background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Test Email</h1>
                </div>
                <div class="content">
                    <p>Hello from BookTableBuddy!</p>
                    <p>This is a test email to verify your email configuration is working.</p>
                    <p><strong>If you're receiving this, your email setup is successful!</strong></p>
                </div>
                <div class="footer">
                    <p>Regards,<br>BookTableBuddy Team</p>
                </div>
            </div>
        </body>
        </html>
        """

        try:
            # Use direct SMTP with custom SSL context to bypass certificate verification
            self.stdout.write("Creating custom SSL context to bypass certificate verification...")
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            
            subject = "BookTableBuddy - Test Email"
            from_email = settings.EMAIL_HOST_USER
            
            self.stdout.write("Setting up SMTP connection...")
            with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
                server.set_debuglevel(1)  # Enable debugging
                self.stdout.write(f"Connected to SMTP server {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
                
                if settings.EMAIL_USE_TLS:
                    self.stdout.write("Starting TLS with custom context...")
                    server.starttls(context=context)
                
                # Login to the SMTP server
                self.stdout.write("Logging in to SMTP server...")
                server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
                
                # Prepare a proper email with headers
                msg = MIMEMultipart('alternative')
                msg['From'] = from_email
                msg['To'] = recipient
                msg['Subject'] = subject
                msg['Reply-To'] = settings.EMAIL_HOST_USER
                msg['Message-ID'] = f"<test.{int(time.time())}@booktablebuddy.com>"
                
                # Add both plain text and HTML versions
                msg.attach(MIMEText(plain_message, 'plain'))
                msg.attach(MIMEText(html_message, 'html'))
                
                # Send the email
                self.stdout.write("Sending email...")
                server.sendmail(
                    from_addr=from_email,
                    to_addrs=[recipient],
                    msg=msg.as_string()
                )
            
            self.stdout.write(self.style.SUCCESS("Test email sent successfully!"))
            self.stdout.write(self.style.WARNING("Important: If you don't see the email, check your spam folder!"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to send email: {str(e)}"))
            self.stdout.write(self.style.ERROR(f"Error type: {type(e).__name__}"))
