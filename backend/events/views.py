"""
Views for Event app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.contrib.auth import get_user_model
from django.conf import settings
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import CreateView, UpdateView, ListView, DetailView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from .models import Event, EventRegistration, CheckIn, Certificate
from .serializers import EventSerializer, EventRegistrationSerializer, CheckInSerializer
from .forms import EventForm
from django.contrib import messages
from crosscert.email_utils import (
    send_registration_confirmation,
    send_attendance_confirmation,
    send_post_event_evaluation_email,
    send_event_created_notification,
)
import uuid

from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator


def _build_registration_code(registration: EventRegistration) -> str:
    """
    Build a per-participant code that encodes the event prefix and
    the participant's registration ID so each user has their own ID.
    Example: CBC-000123
    """
    event = registration.event
    prefix = event.generate_code_prefix()
    return f"{prefix}-{registration.id:06d}"


class EventViewSet(viewsets.ModelViewSet):
    """ViewSet for Event CRUD operations."""
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """Override create to catch exceptions and return JSON error instead of 500."""
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            # Use perform_create to keep behaviour consistent
            try:
                self.perform_create(serializer)
            except Exception as e:
                # Return the exception message for debugging in dev
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        """Attach organizer and bootstrap event QR metadata."""
        user_model = get_user_model()
        organizer = self.request.user if self.request.user.is_authenticated else user_model.objects.first()
        event = serializer.save(organizer=organizer)

        event.generate_code_prefix()
        registration_url = event.build_registration_link()
        event.registration_url = registration_url
        # Event QR code image generation moved to frontend
        # Frontend can generate QR code from registration_url if needed
        event.event_qr_code = ""  # Empty - frontend will generate if needed
        event.save(update_fields=['code_prefix', 'registration_url', 'event_qr_code'])

        # Notify organizer that event has been created
        organizer_email = getattr(organizer, "email", None)
        send_event_created_notification(
            event_title=event.title,
            event_date=str(event.date),
            organizer_email=organizer_email,
        )

    @action(detail=True, methods=['get'])
    def registrations(self, request, pk=None):
        """Get all registrations for an event."""
        event = self.get_object()
        registrations = event.registrations.all()
        serializer = EventRegistrationSerializer(registrations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def conclude(self, request, pk=None):
        """Conclude an event - change status to 'completed'."""
        event = self.get_object()
        
        # Only allow staff/admin to conclude events
        if not request.user.is_staff:
            return Response(
                {'error': 'Only administrators can conclude events.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        event.status = 'completed'
        event.save(update_fields=['status'])
        
        serializer = self.get_serializer(event)
        return Response({
            'message': 'Event concluded successfully.',
            'event': serializer.data
        }, status=status.HTTP_200_OK)


class EventRegistrationViewSet(viewsets.ModelViewSet):
    """ViewSet for Event Registration management."""
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer

    def get_queryset(self):
        """Filter registrations by email and event if provided in query params."""
        queryset = EventRegistration.objects.all()
        
        # Filter by email if provided
        email = self.request.query_params.get('email', None)
        if email:
            queryset = queryset.filter(email=email)
        
        # Filter by event if provided
        event_id = self.request.query_params.get('event', None)
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        
        return queryset

    def create(self, request, *args, **kwargs):
        """Register a participant for an event."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        registration = serializer.save()
        # Ensure the registration has a primary key before building the code
        registration.refresh_from_db()
        code_value = _build_registration_code(registration)
        registration.qr_code_value = code_value
        # QR code image is now generated on the frontend from qr_code_value
        # No need to store base64 image in database
        registration.qr_code = ""  # Empty - frontend will generate
        registration.barcode_image = ""  # Empty - not used
        
        registration.save(update_fields=['qr_code_value', 'qr_code', 'barcode_image'])

        # Send registration confirmation email
        event = registration.event
        event_time = f"{event.start_time.strftime('%I:%M %p')} - {event.end_time.strftime('%I:%M %p')}"
        participant_name = f"{registration.first_name} {registration.last_name}".strip()
        send_registration_confirmation(
            participant_name=participant_name or "Participant",
            event_title=event.title,
            event_date=event.date.strftime('%B %d, %Y'),
            event_time=event_time,
            venue=event.location,
            to_email=registration.email,
        )

        response_serializer = self.get_serializer(registration)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class EventCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Event
    form_class = EventForm
    template_name = 'events/event_form.html'
    success_url = reverse_lazy('event-list')

    def test_func(self):
        return self.request.user.is_staff

    def form_valid(self, form):
        form.instance.organizer = self.request.user
        response = super().form_valid(form)
        messages.success(self.request, 'Event created successfully!')
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_update'] = False
        return context


class EventUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Event
    form_class = EventForm
    template_name = 'events/event_form.html'
    success_url = reverse_lazy('event-list')

    def test_func(self):
        return self.request.user.is_staff

    def form_valid(self, form):
        response = super().form_valid(form)
        messages.success(self.request, 'Event updated successfully!')
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_update'] = True
        return context


class EventListView(LoginRequiredMixin, ListView):
    model = Event
    template_name = 'events/event_list.html'
    context_object_name = 'events'
    paginate_by = 10

    def get_queryset(self):
        if self.request.user.is_staff:
            return Event.objects.all().order_by('-date', '-start_time')
        return Event.objects.filter(is_public=True).order_by('-date', '-start_time')


class EventDetailView(LoginRequiredMixin, DetailView):
    model = Event
    template_name = 'events/event_detail.html'
    context_object_name = 'event'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_participant'] = self.object.registrations.filter(
            email=self.request.user.email
        ).exists()
        return context


class CheckInViewSet(viewsets.ModelViewSet):
    """ViewSet for Check-In management."""
    queryset = CheckIn.objects.all()
    serializer_class = CheckInSerializer

    @action(detail=False, methods=['post'])
    def check_in(self, request):
        """Check in a participant using registration ID."""
        registration_id = request.data.get('registration_id')

        try:
            registration = EventRegistration.objects.get(id=registration_id)
            check_in, created = CheckIn.objects.get_or_create(registration=registration)
            
            if not created:
                return Response(
                    {'message': 'Already checked in'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = self.get_serializer(check_in)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except EventRegistration.DoesNotExist:
            return Response(
                {'error': 'Registration not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], url_path='check-in-by-code')
    def check_in_by_code(self, request):
        """Check in using the participant QR/barcode value (CBC-XXXXXX)."""
        code_value = request.data.get('code')
        if not code_value:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            registration = EventRegistration.objects.get(qr_code_value=code_value)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)

        check_in, created = CheckIn.objects.get_or_create(registration=registration)
        # Keep EventRegistration.is_present in sync with CheckIn
        if not registration.is_present:
            registration.is_present = True
            registration.save(update_fields=['is_present'])

        if not created and check_in.check_out_at is None:
            return Response({'message': 'Already checked in'}, status=status.HTTP_400_BAD_REQUEST)

        # Attendance confirmation email (first time only)
        if created:
            event = registration.event
            participant_name = f"{registration.first_name} {registration.last_name}".strip()
            send_attendance_confirmation(
                participant_name=participant_name or "Participant",
                event_title=event.title,
                event_date=event.date.strftime('%B %d, %Y'),
                venue=event.location,
                to_email=registration.email,
            )

        serializer = self.get_serializer(check_in)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='check-out-by-code')
    def check_out_by_code(self, request):
        """Check out a participant using the same QR/barcode value."""
        from django.utils import timezone

        code_value = request.data.get('code')
        if not code_value:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            registration = EventRegistration.objects.get(qr_code_value=code_value)
        except EventRegistration.DoesNotExist:
            return Response({'error': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce that check-out is only allowed once the event is concluded/completed
        event = registration.event
        if (event.status or '').lower() != 'completed':
            return Response(
                {'error': 'Event must be concluded before participants can be checked out.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            check_in = CheckIn.objects.get(registration=registration)
        except CheckIn.DoesNotExist:
            return Response({'error': 'Participant has not checked in yet'}, status=status.HTTP_400_BAD_REQUEST)

        if check_in.check_out_at is not None:
            return Response({'message': 'Already checked out'}, status=status.HTTP_400_BAD_REQUEST)

        check_in.check_out_at = timezone.now()
        check_in.save(update_fields=['check_out_at'])

        # Send post-event evaluation email with link
        event = registration.event
        frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000")
        eval_url = f"{frontend_base}/participant/event/{event.id}/evaluation"
        participant_name = f"{registration.first_name} {registration.last_name}".strip()
        send_post_event_evaluation_email(
            participant_name=participant_name or "Participant",
            event_title=event.title,
            evaluation_url=eval_url,
            to_email=registration.email,
        )

        serializer = self.get_serializer(check_in)
        return Response(serializer.data, status=status.HTTP_200_OK)
