"""
Certificate models for CROSSCERT.
"""
from django.db import models
from events.models import EventRegistration


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
