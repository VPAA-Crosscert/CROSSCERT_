"""
Views for Participants app.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from .models import Evaluation
from .serializers import EvaluationSerializer
from events.models import CheckIn
from certificates.generator import CertificateService
from certificates.models import Certificate
from django.utils import timezone
import uuid


class ParticipantViewSet(viewsets.ViewSet):
    """ViewSet for Participant management."""
    
    def list(self, request):
        """List all participants."""
        return Response([])

    @action(detail=False, methods=['post'])
    def register(self, request):
        """
        Register a participant as a Django user.
        Enforces @hcdc.edu.ph emails.
        """
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        full_name = request.data.get('name', '').strip()

        if not email or not password or not full_name:
            return Response({'detail': 'Name, email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not email.endswith('@hcdc.edu.ph'):
            return Response({'detail': 'Only @hcdc.edu.ph emails are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        if User.objects.filter(email=email).exists():
            return Response({'detail': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        first_name, *rest = full_name.split(' ')
        last_name = ' '.join(rest)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        return Response({'id': user.id, 'email': user.email}, status=status.HTTP_201_CREATED)


class EvaluationViewSet(viewsets.ModelViewSet):
    """ViewSet for Evaluation management."""
    queryset = Evaluation.objects.all()
    serializer_class = EvaluationSerializer

    def perform_create(self, serializer):
        evaluation = serializer.save()
        registration = evaluation.registration

        # Require both check-in and check-out before accepting evaluation
        try:
            check_in = registration.check_in
        except CheckIn.DoesNotExist:
            raise ValidationError("You must check in and check out before submitting an evaluation.")

        if not check_in.check_out_at:
            raise ValidationError("You must check out before submitting an evaluation.")

        # Auto-generate certificate if not already present
        if not hasattr(registration, "certificate"):
            service = CertificateService()
            pdf_base64 = service.generate_for_participant(registration, registration.event, save_to_disk=False)
            cert_number = f"CERT-{registration.event.id}-{uuid.uuid4().hex[:8].upper()}"
            Certificate.objects.create(
                registration=registration,
                certificate_number=cert_number,
                status="generated",
                pdf_base64=pdf_base64,
                issue_date=timezone.now().date(),
            )
