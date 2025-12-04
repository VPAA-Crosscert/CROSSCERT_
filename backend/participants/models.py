"""
Participant models for CROSSCERT.
"""
from django.db import models
from django.contrib.auth.models import User
from events.models import EventRegistration


class UserProfile(models.Model):
    """User profile model to store additional user information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    department = models.CharField(max_length=200, blank=True)
    program = models.CharField(max_length=200, blank=True)
    birthday = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"Profile for {self.user.email}"


class Evaluation(models.Model):
    """Evaluation model for participant feedback."""
    registration = models.OneToOneField(EventRegistration, on_delete=models.CASCADE, related_name='evaluation')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    year_level = models.CharField(max_length=50)
    content_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    instructor_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    facilities_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    overall_rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evaluation by {self.name} for {self.registration.event.title}"
