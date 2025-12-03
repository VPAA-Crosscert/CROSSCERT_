"""
Serializers for Certificates app.
"""
from rest_framework import serializers
from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    """Serializer for Certificate model."""

    event_title = serializers.CharField(source='registration.event.title', read_only=True)
    participant_email = serializers.CharField(source='registration.email', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id',
            'registration',
            'certificate_number',
            'issue_date',
            'status',
            'pdf_file',
            'pdf_base64',
            'event_title',
            'participant_email',
        ]
        read_only_fields = ['pdf_file']
