"""
Serializers for Event app.
"""
from rest_framework import serializers
from .models import Event, EventRegistration, CheckIn


class EventSerializer(serializers.ModelSerializer):
    """Serializer for Event model."""

    registration_count = serializers.SerializerMethodField()
    organizer_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'date',
            'start_time',
            'end_time',
            'location',
            'capacity',
            'status',
            'speakers',
            'timezone',
            'category',
            'department',
            'theme',
            'cover_image',
            'is_public',
            'require_approval',
            'is_paid_event',
            'ticket_price',
            'code_prefix',
            'registration_url',
            'event_qr_code',
            'certificate_template_image',
            'certificate_coordinates',
            'certificate_sample_text',
            'created_at',
            'updated_at',
            'registration_count',
            'organizer_name',
        ]
        read_only_fields = [
            'code_prefix',
            'registration_url',
            'event_qr_code',
            'created_at',
            'updated_at',
            'registration_count',
            'organizer_name',
        ]

    def get_registration_count(self, obj):
        return obj.registrations.count()

    def get_organizer_name(self, obj):
        return obj.organizer.get_full_name() or obj.organizer.username


class EventRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for EventRegistration model."""

    class Meta:
        model = EventRegistration
        fields = [
            'id',
            'event',
            'email',
            'first_name',
            'last_name',
            'affiliation',
            'registered_at',
            'qr_code',
            'qr_code_value',
            'barcode_image',
        ]
        read_only_fields = ['qr_code', 'qr_code_value', 'barcode_image', 'registered_at']


class CheckInSerializer(serializers.ModelSerializer):
    """Serializer for CheckIn model."""
    participant_name = serializers.SerializerMethodField()
    event_title = serializers.SerializerMethodField()

    class Meta:
        model = CheckIn
        fields = ['id', 'registration', 'checked_in_at', 'check_out_at', 'participant_name', 'event_title']

    def get_participant_name(self, obj):
        return f"{obj.registration.first_name} {obj.registration.last_name}"

    def get_event_title(self, obj):
        return obj.registration.event.title
