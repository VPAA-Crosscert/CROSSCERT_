"""
Certificate models for CROSSCERT.
"""
from django.db import models
from django.core.mail import EmailMessage
from django.conf import settings
from events.models import EventRegistration
from datetime import datetime
import base64


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
            
            # Create plain-text email message
            message = f"""
Dear {self.registration.first_name},

Congratulations! Your certificate for {self.registration.event.title} is ready.

Event Date: {self.registration.event.date}
Certificate Number: {self.certificate_number}

Your certificate has been generated and is available in your account. You can view and download it from the "My Certificates" section.

Best regards,
CROSSCERT Team
            """

            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'crosscert.dvo@gmail.com'),
                to=[self.registration.email],
            )

            # Attach PDF certificate
            if self.pdf_file:
                # If a file is stored on disk, attach it directly
                try:
                    email.attach_file(self.pdf_file.path)
                except Exception as attach_err:
                    print(f"[Certificate Email] Failed to attach pdf_file: {attach_err}")
            elif self.pdf_base64:
                # Decode base64 and attach as PDF bytes
                try:
                    # Handle potential data URL prefix
                    parts = self.pdf_base64.split(',')
                    raw_base64 = parts[1] if len(parts) > 1 else parts[0]
                    pdf_bytes = base64.b64decode(raw_base64)
                    filename = f"{self.certificate_number}.pdf"
                    email.attach(filename, pdf_bytes, 'application/pdf')
                except Exception as decode_err:
                    print(f"[Certificate Email] Failed to decode/attach pdf_base64: {decode_err}")

            email.send(fail_silently=False)
            
            # Update status
            self.status = 'sent'
            self.save(update_fields=['status'])
            return True
        except Exception as e:
            print(f"[Certificate Email] Failed to send email: {e}")
            return False
