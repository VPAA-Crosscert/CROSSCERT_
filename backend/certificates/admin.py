"""
Admin configuration for Certificate model.
"""
from django.contrib import admin
from .models import Certificate


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('certificate_number', 'registration', 'status', 'issue_date')
    list_filter = ('status', 'issue_date')
    search_fields = ('certificate_number', 'registration__email')
    readonly_fields = ('issue_date', 'created_at')
