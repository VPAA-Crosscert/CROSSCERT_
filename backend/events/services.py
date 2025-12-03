from PIL import Image, ImageDraw, ImageFont
import os
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings

class CertificateService:
    def generate_certificate(self, registration, template_url, coordinates):
        """Generate a certificate for the given registration."""
        try:
            # Open the template image
            template_path = os.path.join(settings.MEDIA_ROOT, template_url)
            img = Image.open(template_path)
            draw = ImageDraw.Draw(img)
            
            # Load font
            font_path = getattr(settings, 'DEFAULT_FONT', 'arial.ttf')
            font_size = 24
            font = ImageFont.truetype(font_path, font_size)
            
            # Draw participant name
            name_coords = coordinates.get('name', {})
            if name_coords:
                draw.text(
                    (name_coords.get('x', 0), name_coords.get('y', 0)),
                    registration.full_name,
                    fill='black',
                    font=font
                )
            
            # Draw event title
            event_coords = coordinates.get('event_title', {})
            if event_coords:
                draw.text(
                    (event_coords.get('x', 0), event_coords.get('y', 0)),
                    registration.event.title,
                    fill='black',
                    font=font
                )
            
            # Draw date
            date_coords = coordinates.get('date', {})
            if date_coords:
                draw.text(
                    (date_coords.get('x', 0), date_coords.get('y', 0)),
                    registration.event.date.strftime('%B %d, %Y'),
                    fill='black',
                    font=font
                )
            
            # Save the certificate
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            
            # Create the certificate file
            from .models import Certificate
            certificate, created = Certificate.objects.get_or_create(
                registration=registration
            )
            
            filename = f"certificate_{registration.id}.png"
            certificate.certificate_file.save(
                filename,
                ContentFile(buffer.getvalue()),
                save=True
            )
            
            return certificate.certificate_file.url
            
        except Exception as e:
            print(f"Error generating certificate: {str(e)}")
            raise
