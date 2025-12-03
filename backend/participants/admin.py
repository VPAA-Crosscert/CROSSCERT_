from django.contrib import admin
from .models import Evaluation

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'overall_rating', 'submitted_at')
    list_filter = ('overall_rating', 'submitted_at')
    search_fields = ('name', 'email', 'registration__event__title')
    readonly_fields = ('submitted_at',)
