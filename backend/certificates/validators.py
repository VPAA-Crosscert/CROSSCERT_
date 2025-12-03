"""
Validators for certificate-related files.
"""
from PIL import Image
import io
import base64
from django.core.exceptions import ValidationError


def is_landscape_orientation(image_data):
    """
    Check if an image has landscape orientation (width > height).
    
    Args:
        image_data: Base64 string, data URL, bytes, or file object
        
    Returns:
        bool: True if landscape, False otherwise
        
    Raises:
        ValidationError: If image cannot be read
    """
    try:
        # Handle different input types
        if isinstance(image_data, str):
            if ',' in image_data:  # Data URL format
                image_data = image_data.split(',', 1)[1]
            image_bytes = base64.b64decode(image_data)
        elif isinstance(image_data, bytes):
            image_bytes = image_data
        elif hasattr(image_data, 'read'):  # File-like object
            image_bytes = image_data.read()
        else:
            raise ValidationError("Invalid image data format")
        
        # Open and check image
        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.size
        
        return width > height
    except Exception as e:
        raise ValidationError(f"Could not read image: {str(e)}")


def validate_landscape_certificate(image_data):
    """
    Validator function for Django model fields.
    Raises ValidationError if image is not in landscape orientation.
    """
    if not image_data:
        return
    
    if not is_landscape_orientation(image_data):
        raise ValidationError(
            "Certificate template must be in landscape orientation (width > height)."
        )


def validate_certificate_image_format(image_data):
    """
    Validator function to ensure image format is supported.
    Supports: PNG, JPG, JPEG, GIF, BMP
    """
    if not image_data:
        return
    
    try:
        if isinstance(image_data, str):
            if ',' in image_data:
                image_data = image_data.split(',', 1)[1]
            image_bytes = base64.b64decode(image_data)
        elif isinstance(image_data, bytes):
            image_bytes = image_data
        else:
            image_bytes = image_data.read()
        
        image = Image.open(io.BytesIO(image_bytes))
        format_name = image.format
        
        allowed_formats = {'PNG', 'JPEG', 'JPG', 'GIF', 'BMP', 'WEBP'}
        if format_name not in allowed_formats:
            raise ValidationError(
                f"Unsupported image format: {format_name}. "
                f"Supported formats: {', '.join(allowed_formats)}"
            )
    except ValidationError:
        raise
    except Exception as e:
        raise ValidationError(f"Could not validate image format: {str(e)}")
