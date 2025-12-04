"""
Certificate generation module for CROSSCERT.
Handles PDF generation with customizable templates and coordinate-driven overlays.
Supports any landscape-oriented certificate template size.
"""
from datetime import datetime
import base64
import io
import os
from pathlib import Path

from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image
from django.conf import settings

from .models import Certificate as CertificateModel


class CertificateGenerator:
    """Generate PDF certificates with customizable templates of any landscape size."""

    def __init__(self, template_image=None):
        """
        Initialize certificate generator.
        If template_image is provided, page size is determined from the image dimensions.
        Otherwise, defaults to standard landscape A4 (1123, 794).
        """
        self.template_image = template_image
        self.page_width, self.page_height = self._get_page_dimensions()
        self.primary_color = HexColor('#bf1818')  # CROSSCERT Red
        self.text_color = HexColor('#1c1c1c')

    def _get_page_dimensions(self):
        """
        Extract page dimensions from template image if available.
        Otherwise, return standard landscape A4 dimensions.
        """
        if not self.template_image:
            return (1123, 794)  # Standard landscape A4
        
        try:
            image_bytes = self._decode_base64_image(self.template_image)
            if not image_bytes:
                return (1123, 794)
            
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            return (width, height)
        except Exception:
            # Fallback to standard dimensions if image processing fails
            return (1123, 794)

    def _get_page_dimensions_for_template(self, template_image):
        """
        Extract page dimensions from a specific template image.
        Used during certificate generation.
        """
        if not template_image:
            return (self.page_width, self.page_height)
        
        try:
            image_bytes = self._decode_base64_image(template_image)
            if not image_bytes:
                return (self.page_width, self.page_height)
            
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            return (width, height)
        except Exception:
            # Fallback to current dimensions if processing fails
            return (self.page_width, self.page_height)

    def _decode_base64_image(self, data_url):
        """Convert a data URL or raw base64 string into bytes."""
        if not data_url:
            return None
        if ',' in data_url:
            data_url = data_url.split(',', 1)[1]
        return base64.b64decode(data_url)

    def _draw_template(self, c, template_image):
        """Draw template background image, scaling to fit the page."""
        if not template_image:
            return
        image_bytes = self._decode_base64_image(template_image)
        if not image_bytes:
            return
        image_reader = ImageReader(io.BytesIO(image_bytes))
        c.drawImage(image_reader, 0, 0, width=self.page_width, height=self.page_height)

    def _draw_text(self, c, text, coords, font='Helvetica-Bold', size=28, align='center'):
        """Draw text at specified coordinates."""
        x = coords.get('x', self.page_width / 2)
        y = coords.get('y', self.page_height / 2)
        c.setFont(font, size)
        c.setFillColor(self.text_color)
        if align == 'center':
            c.drawCentredString(x, y, text)
        elif align == 'right':
            c.drawRightString(x, y, text)
        else:
            c.drawString(x, y, text)

    def generate_certificate(
        self,
        participant_data,
        event_data,
        template_image=None,
        coordinates=None,
        sample_text=None,
        output_path=None,
        return_base64=True,
    ):
        """
        Generate a certificate PDF with dynamic sizing based on template.

        Args:
            participant_data: Dict with keys - name, email, year_level
            event_data: Dict with keys - title, date, organizer
            template_image: Base64 background image (any landscape size)
            coordinates: Dict with x/y for fields (name, event_title, date)
            sample_text: Dict overriding text for previews
            output_path: Optional path to save PDF
            return_base64: When True returns base64 string, otherwise BytesIO/path
        
        Returns:
            str (base64) or BytesIO or file path depending on parameters
        """
        # Use provided template or instance template
        template_to_use = template_image or self.template_image
        
        # Re-initialize dimensions based on template
        self.page_width, self.page_height = self._get_page_dimensions_for_template(template_to_use)
        
        if output_path:
            os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=(self.page_width, self.page_height))
        coords = coordinates or {}
        text_overrides = sample_text or {}

        # Draw template background
        self._draw_template(c, template_to_use)

        # Participant name
        name_text = text_overrides.get('name') or participant_data.get('name', 'Participant Name')
        self._draw_text(c, name_text.upper(), coords.get('name', {}), size=38)

        # Event title
        event_title = text_overrides.get('event_title') or event_data.get('title', 'Event Title')
        self._draw_text(c, event_title, coords.get('event_title', {}), size=24)

        # Event date
        event_date = text_overrides.get('date') or event_data.get('date', 'January 01, 2025')
        self._draw_text(c, event_date, coords.get('date', {}), size=18)

        # Organizer signature placeholder
        organizer = event_data.get('organizer', '')
        signature_y = coords.get('signature', {}).get('y', 160)
        c.setLineWidth(1)
        c.line(self.page_width * 0.2, signature_y, self.page_width * 0.8, signature_y)
        self._draw_text(
            c,
            organizer or 'Office of the VPAA',
            {'x': self.page_width / 2, 'y': signature_y - 20},
            size=12,
        )

        # Watermark
        self._draw_text(
            c,
            'pinay.py',
            {'x': self.page_width - 24, 'y': 24},
            font='Helvetica-Bold',
            size=12,
            align='right',
        )

        c.showPage()
        c.save()
        pdf_bytes = buffer.getvalue()

        if output_path:
            with open(output_path, 'wb') as f:
                f.write(pdf_bytes)

        if return_base64:
            return base64.b64encode(pdf_bytes).decode()

        buffer.seek(0)
        return buffer if not output_path else output_path


class CertificateService:
    """Service class to manage certificate generation and storage."""

    def __init__(self, storage_path='certificates'):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.generator = CertificateGenerator()

    def generate_for_participant(self, registration, event, save_to_disk=False):
        """
        Generate certificate for a participant.

        Returns:
            Base64 encoded PDF string by default.
        """
        participant_data = {
            'name': f"{registration.first_name} {registration.last_name}",
            'email': registration.email,
            'year_level': registration.affiliation,
        }

        event_data = {
            'title': event.title,
            'date': event.date.strftime('%B %d, %Y'),
            'organizer': event.organizer.get_full_name() or event.organizer.username,
        }

        output_path = None
        if save_to_disk:
            filename = f"{registration.id}_{event.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
            output_path = str(self.storage_path / filename)

        return self.generator.generate_certificate(
            participant_data,
            event_data,
            template_image=event.certificate_template_image,
            coordinates=event.certificate_coordinates,
            sample_text=None,
            output_path=output_path,
            return_base64=not save_to_disk,
        )

    def generate_batch_certificates(self, event, registrations_list, save_to_disk=False):
        certificate_payloads = []
        for registration in registrations_list:
            try:
                payload = self.generate_for_participant(registration, event, save_to_disk=save_to_disk)
                certificate_payloads.append(payload)
            except Exception as exc:
                print(f"Error generating certificate for {registration.email}: {exc}")
        return certificate_payloads


def generate_certificates_for_event(event_id):
    """
    Generate certificates for all eligible participants of an event.
    Stores base64 payloads on the Certificate records.
    """
    from events.models import Event, EventRegistration
    from certificates.models import Certificate
    from django.utils import timezone
    import uuid as uuid_lib

    try:
        event = Event.objects.get(id=event_id)
        service = CertificateService()

        eligible_registrations = EventRegistration.objects.filter(
            event=event,
            check_in__isnull=False,
            evaluation__isnull=False,
        ).exclude(certificate__isnull=False)

        for registration in eligible_registrations:
            pdf_base64 = service.generate_for_participant(registration, event, save_to_disk=False)
            cert_number = f"CERT-{event.id}-{uuid_lib.uuid4().hex[:8].upper()}"
            Certificate.objects.create(
                registration=registration,
                certificate_number=cert_number,
                pdf_base64=pdf_base64,
                status='generated',
                created_at=timezone.now(),
            )

        return True
    except Event.DoesNotExist:
        print(f"Event with ID {event_id} not found")
        return False


def generate_certificate(registration):
    """
    Generate a certificate for a single registration.
    
    Args:
        registration: EventRegistration instance
        
    Returns:
        str: Path to the generated certificate file
    """
    from django.conf import settings
    from .models import Certificate as CertificateModel
    from .services import CertificateService
    import os
    from datetime import datetime
    
    # Initialize the certificate service
    cert_service = CertificateService()
    
    try:
        # Check if certificate already exists
        if hasattr(registration, 'certificate_record'):
            return registration.certificate_record.pdf_file.path if registration.certificate_record.pdf_file else None
        
        # Generate the certificate
        event = registration.event
        participant_name = f"{registration.first_name} {registration.last_name}"
        
        # Create the certificate
        cert_path = cert_service.generate_for_participant(
            registration=registration,
            event=event,
            save_to_disk=True
        )
        
        if not cert_path:
            raise ValueError("Failed to generate certificate")
            
        # Create certificate record in the database
        cert = CertificateModel.objects.create(
            registration=registration,
            certificate_file=cert_path,
            issued_at=datetime.now()
        )
        
        return cert_path
        
    except Exception as e:
        print(f"Error generating certificate: {str(e)}")
        raise
