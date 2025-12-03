"""
Celery tasks for async certificate generation and email delivery.
Optional: Use for background processing.
"""
from celery import shared_task
from django.core.mail import EmailMessage
from .generator import CertificateService
from events.models import Event, EventRegistration
from .models import Certificate
import os


@shared_task
def generate_and_send_certificates(event_id):
    """
    Celery task to generate and send certificates for an event.
    
    Args:
        event_id: ID of the event
    """
    try:
        event = Event.objects.get(id=event_id)
        service = CertificateService()
        
        # Get eligible registrations
        eligible_registrations = EventRegistration.objects.filter(
            event=event,
            check_in__isnull=False,
            evaluation__isnull=False,
        ).exclude(certificate__isnull=False)
        
        for registration in eligible_registrations:
            # Generate certificate
            pdf_path = service.generate_for_participant(registration, event)
            
            # Create certificate record
            certificate = Certificate.objects.create(
                registration=registration,
                certificate_number=f"CERT-{event.id}-{registration.id}",
                pdf_file=pdf_path,
                status='generated',
            )
            
            # Send email with certificate
            send_certificate_email.delay(certificate.id)
        
        return {'status': 'success', 'count': eligible_registrations.count()}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}


@shared_task
def send_certificate_email(certificate_id):
    """
    Celery task to send certificate via email.
    
    Args:
        certificate_id: ID of the certificate
    """
    try:
        from .models import Certificate
        certificate = Certificate.objects.get(id=certificate_id)
        registration = certificate.registration
        
        subject = f"Your Certificate - {registration.event.title}"
        message = f"""
        Dear {registration.first_name},
        
        Congratulations! Your certificate for {registration.event.title} is ready.
        
        Event Date: {registration.event.date}
        Certificate Number: {certificate.certificate_number}
        
        Please find your certificate attached.
        
        Best regards,
        CROSSCERT Team
        """
        
        email = EmailMessage(
            subject=subject,
            body=message,
            from_email=os.getenv('EMAIL_FROM', 'noreply@crosscert.com'),
            to=[registration.email],
        )
        
        # Attach certificate PDF
        if certificate.pdf_file:
            email.attach_file(certificate.pdf_file)
        
        email.send()
        
        certificate.status = 'sent'
        certificate.save()
        
        return {'status': 'success', 'email': registration.email}
    except Exception as e:
        return {'status': 'error', 'message': str(e)}
