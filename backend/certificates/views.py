"""
Views for Certificates app.
"""
import os
from django.conf import settings
from django.http import FileResponse, JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from events.models import Event, EventRegistration, Certificate as EventCertificate
from .serializers import CertificateSerializer
from .generator import generate_certificate


class CertificateViewSet(viewsets.ModelViewSet):
    """ViewSet for Certificate management."""
    queryset = EventCertificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter certificates based on user role."""
        user = self.request.user
        if user.is_staff:
            return EventCertificate.objects.all()
        # For regular users, only show their own certificates
        return EventCertificate.objects.filter(registration__email=user.email)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def generate_certificate(self, request, pk=None):
        """Generate a certificate for a registration."""
        registration = get_object_or_404(EventRegistration, pk=pk, is_present=True)
        
        # Check if certificate already exists
        if hasattr(registration, 'certificate'):
            return Response(
                {'error': 'Certificate already exists for this registration'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate certificate file
            certificate_path = generate_certificate(registration)
            
            # Create certificate record
            certificate = EventCertificate.objects.create(
                registration=registration,
                certificate_file=certificate_path
            )
            
            serializer = self.get_serializer(certificate)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def send_email(self, request, pk=None):
        """Send certificate via email."""
        certificate = self.get_object()
        try:
            if certificate.send_certificate_email():
                return Response(
                    {'status': 'Email sent successfully'},
                    status=status.HTTP_200_OK
                )
            return Response(
                {'error': 'Failed to send email'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_generate(self, request):
        """Generate certificates for all eligible participants of an event."""
        event_id = request.data.get('event_id')
        if not event_id:
            return Response(
                {'error': 'event_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        event = get_object_or_404(Event, pk=event_id)
        registrations = event.registrations.filter(
            is_present=True,
            is_eligible_for_certificate=True
        )
        
        generated = 0
        errors = []
        
        for registration in registrations:
            if not hasattr(registration, 'certificate'):
                try:
                    certificate_path = generate_certificate(registration)
                    EventCertificate.objects.create(
                        registration=registration,
                        certificate_file=certificate_path
                    )
                    generated += 1
                except Exception as e:
                    errors.append(f"Failed to generate certificate for {registration.email}: {str(e)}")
        
        return Response({
            'generated': generated,
            'errors': errors
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def bulk_send_emails(self, request):
        """Send certificates via email to all participants of an event."""
        event_id = request.data.get('event_id')
        if not event_id:
            return Response(
                {'error': 'event_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        event = get_object_or_404(Event, pk=event_id)
        certificates = EventCertificate.objects.filter(registration__event=event)
        
        sent = 0
        errors = []
        
        for certificate in certificates:
            try:
                if not certificate.is_emailed:
                    if certificate.send_certificate_email():
                        sent += 1
            except Exception as e:
                errors.append(f"Failed to send email to {certificate.registration.email}: {str(e)}")
        
        return Response({
            'sent': sent,
            'errors': errors
        }, status=status.HTTP_200_OK)


class QRCodeViewSet(viewsets.ViewSet):
    """ViewSet for QR code scanning and validation."""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def scan(self, request):
        """Scan and validate a QR code."""
        qr_value = request.data.get('qr_value')
        if not qr_value:
            return Response(
                {'error': 'QR code value is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            registration = EventRegistration.objects.get(qr_code_value=qr_value)
            return Response({
                'valid': True,
                'registration_id': registration.id,
                'name': registration.full_name,
                'event': registration.event.title,
                'is_present': registration.is_present
            })
        except EventRegistration.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Invalid QR code'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def mark_present(self, request):
        """Mark a participant as present using QR code."""
        qr_value = request.data.get('qr_value')
        if not qr_value:
            return Response(
                {'error': 'QR code value is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            registration = EventRegistration.objects.get(qr_code_value=qr_value)
            if registration.is_present:
                return Response({
                    'message': 'Participant is already marked as present',
                    'registration_id': registration.id,
                    'name': registration.full_name
                })
                
            registration.mark_as_present()
            return Response({
                'message': 'Participant marked as present',
                'registration_id': registration.id,
                'name': registration.full_name
            })
        except EventRegistration.DoesNotExist:
            return Response(
                {'error': 'Invalid QR code'},
                status=status.HTTP_404_NOT_FOUND
            )
