from django.contrib import admin
from .models import Evaluation, UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'program', 'birthday')
    list_filter = ('department',)
    search_fields = ('user__email', 'user__username', 'department', 'program')
    raw_id_fields = ('user',)

@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'overall_rating', 'submitted_at')
    list_filter = ('overall_rating', 'submitted_at')
    search_fields = ('name', 'email', 'registration__event__title')
    readonly_fields = ('submitted_at',)
