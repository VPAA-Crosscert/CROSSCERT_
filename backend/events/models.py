"""
Event models for CROSSCERT.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.core.validators import MinValueValidator, FileExtensionValidator
from django.conf import settings
from django.core.files.storage import default_storage
from django.db.models import Q
import uuid
import os
from datetime import datetime
from django.core.mail import EmailMessage, send_mail
from markdownx.models import MarkdownxField
from certificates.validators import validate_landscape_certificate, validate_certificate_image_format


def default_certificate_coordinates():
    """Provide sane defaults so admins can preview overlays immediately."""
    return {
        'name': {'x': 561, 'y': 420},
        'event_title': {'x': 561, 'y': 360},
        'date': {'x': 561, 'y': 300},
    }


def default_certificate_sample_text():
    return {
        'name': 'Juan Dela Cruz',
        'event_title': 'Sample Event Title',
        'date': 'January 01, 2025',
    }


class Event(models.Model):
    """Event model for managing seminars and workshops."""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('live', 'Live'),
        ('completed', 'Completed'),
    ]

    CATEGORY_CHOICES = [
        ('HCDC', 'HCDC Wide Event'),
        ('department', 'Department Event'),
        ('outside', 'Outside Event'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organized_events')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    location = models.CharField(max_length=255)
    capacity = models.IntegerField(default=50, validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    speakers = models.JSONField(default=list, blank=True)
    timezone = models.CharField(max_length=50, default='Asia/Manila')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='HCDC')
    department = models.CharField(max_length=120, blank=True)
    departmental_details = MarkdownxField(blank=True, null=True, help_text="Markdown supported for departmental events")
    theme = models.CharField(max_length=50, default='Professional Blue')
    cover_image = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    require_approval = models.BooleanField(default=False)
    is_paid_event = models.BooleanField(default=False)
    ticket_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    code_prefix = models.CharField(max_length=16, blank=True)
    registration_url = models.URLField(blank=True)
    event_qr_code = models.TextField(blank=True)
    certificate_template_image = models.TextField(
        blank=True,
        validators=[validate_landscape_certificate, validate_certificate_image_format],
        help_text="Upload a landscape-oriented certificate template (PNG, JPG, JPEG, GIF, BMP, or WEBP). Any size is supported."
    )
    certificate_coordinates = models.JSONField(default=default_certificate_coordinates, blank=True)
    certificate_sample_text = models.JSONField(default=default_certificate_sample_text, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.title
        
    def get_certificate_template(self):
        """Return the URL of the certificate template if it exists."""
        if self.certificate_template_image:
            return self.certificate_template_image
        return None

    def can_issue_certificate(self):
        """Check if the event has all required certificate information."""
        return bool(self.certificate_template_image and self.certificate_coordinates)
        
    def get_status_badge(self):
        """Return the appropriate Bootstrap badge class for the event status."""
        status_classes = {
            'draft': 'secondary',
            'scheduled': 'info',
            'live': 'success',
            'completed': 'dark',
            'cancelled': 'danger',
        }
        return status_classes.get(self.status, 'secondary')

    def generate_code_prefix(self):
        """Generate the 3-letter prefix derived from the event title."""
        if self.code_prefix:
            return self.code_prefix

        parts = [word[0].upper() for word in self.title.split() if word]
        prefix = ''.join(parts[:3])
        prefix = (prefix + 'EVT')[:3] if len(prefix) < 3 else prefix[:3]
        self.code_prefix = prefix
        return self.code_prefix

    def build_registration_link(self):
        """Generate the canonical registration URL for QR linking."""
        base_url = getattr(settings, 'FRONTEND_BASE_URL', 'http://localhost:3000')
        slug = slugify(self.title) or uuid.uuid4().hex[:6]
        return f"{base_url}/event/{self.id or slug}"


class EventRegistration(models.Model):
    """Event registration model for participants."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    email = models.EmailField()
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    affiliation = models.CharField(max_length=100)
    registered_at = models.DateTimeField(auto_now_add=True)
    qr_code = models.TextField(blank=True)
    qr_code_value = models.CharField(max_length=64, unique=True, null=True, blank=True)
    barcode_image = models.TextField(blank=True)
    is_present = models.BooleanField(default=False)
    has_evaluated = models.BooleanField(default=False)
    is_eligible_for_certificate = models.BooleanField(default=False)

    class Meta:
        unique_together = ('event', 'email')

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.event.title}"
        
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
        
    def mark_as_present(self):
        """Mark participant as present and create a check-in record."""
        self.is_present = True
        self.save()
        CheckIn.objects.get_or_create(registration=self)
        return True
        
    def mark_evaluation_complete(self):
        """Mark that the participant has completed the evaluation."""
        self.has_evaluated = True
        self.is_eligible_for_certificate = True
        self.save()
        return True


class CheckIn(models.Model):
    """Check-in model for attendance tracking."""
    registration = models.OneToOneField(EventRegistration, on_delete=models.CASCADE, related_name='check_in')
    checked_in_at = models.DateTimeField(auto_now_add=True)
    check_out_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.registration.first_name} - {self.registration.event.title}"


class Certificate(models.Model):
    """Certificate model for event participants."""
    registration = models.OneToOneField(
        'EventRegistration', 
        on_delete=models.CASCADE, 
        related_name='certificate'
    )
    certificate_file = models.FileField(
        upload_to='certificates/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'png', 'jpg', 'jpeg'])],
        help_text="Generated certificate file",
        max_length=500,
        null=True,
        blank=True
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    is_emailed = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-issued_at']
        verbose_name = 'Certificate'
        verbose_name_plural = 'Certificates'

    def __str__(self):
        return f"Certificate for {self.registration.full_name} - {self.registration.event.title}"
        
    def get_certificate_url(self):
        """Return the URL of the generated certificate file."""
        if self.certificate_file:
            return self.certificate_file.url
        return None

    def generate_certificate(self):
        """Generate the certificate using the event's template."""
        from .services import CertificateService
        
        if not self.registration.event.can_issue_certificate():
            raise ValueError("Event is not properly configured for certificate generation")
            
        service = CertificateService()
        return service.generate_certificate(
            registration=self.registration,
            template_url=self.registration.event.get_certificate_template(),
            coordinates=self.registration.event.certificate_coordinates
        )

    def send_certificate_email(self, request=None):
        """Send certificate via email to the participant."""
        if not self.certificate_file:
            return False
            
        subject = f"Your Certificate for {self.registration.event.title}"
        # Simple plain-text email with PDF attachment using Django's configured backend (Gmail SMTP)
        message = f"""
Dear {self.registration.full_name},

Congratulations! Your certificate for {self.registration.event.title} is ready.

Event Date: {self.registration.event.date}

Your certificate is attached as a PDF to this email. You can also access it in your CROSSCERT account.

Best regards,
CROSSCERT Team
        """.strip()
        
        try:
            email = EmailMessage(
                subject=subject,
                body=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'crosscert.dvo@gmail.com'),
                to=[self.registration.email],
            )
            # Attach the certificate file
            try:
                email.attach_file(self.certificate_file.path)
            except Exception as attach_err:
                print(f"Failed to attach certificate file: {attach_err}")

            email.send(fail_silently=False)
            self.is_emailed = True
            self.email_sent_at = datetime.now()
            self.save()
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
