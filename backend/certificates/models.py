"""
Certificate models for CROSSCERT.
"""
from django.db import models
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from events.models import EventRegistration
from datetime import datetime


class Certificate(models.Model):
    """Certificate model for generated certificates."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generated', 'Generated'),
        ('sent', 'Sent'),
    ]

    registration = models.OneToOneField(EventRegistration, on_delete=models.CASCADE, related_name='certificate_record')
    certificate_number = models.CharField(max_length=50, unique=True)
    issue_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    pdf_file = models.FileField(upload_to='certificates/', null=True, blank=True)
    pdf_base64 = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Certificate {self.certificate_number}"

    def send_certificate_email(self):
        """Send certificate via email to the participant."""
        if not self.pdf_base64 and not self.pdf_file:
            return False
        
        try:
            subject = f"Your Certificate for {self.registration.event.title}"
            
            # Create email message
            message = f"""
Dear {self.registration.first_name},

Congratulations! Your certificate for {self.registration.event.title} is ready.

Event Date: {self.registration.event.date}
Certificate Number: {self.certificate_number}

Your certificate has been generated and is available in your account. You can view and download it from the "My Certificates" section.

Best regards,
CROSSCERT Team
            """
            
            # Try to use Brevo SMTP if configured
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'crosscert.dvo@gmail.com'),
                    recipient_list=[self.registration.email],
                    fail_silently=False,
                    auth_user=getattr(settings, 'BREVO_SMTP_USER', None),
                    auth_password=getattr(settings, 'BREVO_SMTP_PASSWORD', None),
                )
            except Exception as e:
                # Fallback to default email backend
                print(f"[Certificate Email] Brevo SMTP failed, trying default: {e}")
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@crosscert.com'),
                    recipient_list=[self.registration.email],
                    fail_silently=False,
                )
            
            # Update status
            self.status = 'sent'
            self.save(update_fields=['status'])
            return True
        except Exception as e:
            print(f"[Certificate Email] Failed to send email: {e}")
            return False
