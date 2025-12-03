from django import forms
from .models import Event
from markdownx.fields import MarkdownxFormField
from certificates.validators import is_landscape_orientation
import base64


class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'date', 'start_time', 'end_time', 
            'location', 'capacity', 'category', 'department', 'departmental_details',
            'is_public', 'certificate_template_image', 'certificate_coordinates',
            'certificate_sample_text'
        ]
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'start_time': forms.TimeInput(attrs={'type': 'time'}),
            'end_time': forms.TimeInput(attrs={'type': 'time'}),
            'description': forms.Textarea(attrs={'rows': 4}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['departmental_details'].required = False
        
        # Add form-control class to all fields
        for field_name, field in self.fields.items():
            if field_name not in ['is_public']:  # Skip checkboxes
                field.widget.attrs.update({'class': 'form-control'})

    def clean_certificate_template_image(self):
        """Validate certificate template image."""
        image_data = self.cleaned_data.get('certificate_template_image')
        
        if not image_data:
            return image_data
        
        # Check landscape orientation
        try:
            if not is_landscape_orientation(image_data):
                raise forms.ValidationError(
                    "Certificate template must be in landscape orientation (width > height). "
                    "Please upload an image that is wider than it is tall."
                )
        except Exception as e:
            if isinstance(e, forms.ValidationError):
                raise
            raise forms.ValidationError(
                f"Could not validate certificate template image: {str(e)}"
            )
        
        return image_data

