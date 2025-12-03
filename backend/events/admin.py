from django.contrib import admin
from .models import Event, EventRegistration, CheckIn, Certificate

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'date', 'status', 'created_at')
    list_filter = ('status', 'category', 'date', 'created_at')
    search_fields = ('title', 'description', 'organizer__email')
    readonly_fields = ('code_prefix', 'registration_url', 'event_qr_code', 'created_at', 'updated_at')
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'organizer')
        }),
        ('Event Details', {
            'fields': ('date', 'start_time', 'end_time', 'location', 'capacity', 'status', 'category')
        }),
        ('Department Info', {
            'fields': ('department', 'departmental_details'),
            'classes': ('collapse',)
        }),
        ('Certificate', {
            'fields': ('certificate_template_image', 'certificate_coordinates', 'certificate_sample_text')
        }),
        ('Registration', {
            'fields': ('code_prefix', 'registration_url', 'event_qr_code')
        }),
        ('Settings', {
            'fields': ('theme', 'is_public', 'require_approval', 'is_paid_event', 'ticket_price', 'timezone'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('email', 'event', 'is_present', 'registered_at')
    list_filter = ('is_present', 'is_eligible_for_certificate', 'registered_at')
    search_fields = ('email', 'event__title', 'first_name', 'last_name')
    readonly_fields = ('registered_at',)

@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):
    list_display = ('registration', 'checked_in_at')
    list_filter = ('checked_in_at',)
    search_fields = ('registration__email',)
    readonly_fields = ('checked_in_at',)

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('registration', 'issued_at', 'is_emailed')
    list_filter = ('is_emailed', 'issued_at')
    search_fields = ('registration__email', 'registration__event__title')
    readonly_fields = ('issued_at',)
