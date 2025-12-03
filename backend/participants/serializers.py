"""
Serializers for Participants app.
"""
from rest_framework import serializers
from .models import Evaluation


class EvaluationSerializer(serializers.ModelSerializer):
    """Serializer for Evaluation model."""
    class Meta:
        model = Evaluation
        fields = ['id', 'registration', 'name', 'email', 'year_level', 
                  'content_rating', 'instructor_rating', 'facilities_rating', 
                  'overall_rating', 'feedback', 'submitted_at']
