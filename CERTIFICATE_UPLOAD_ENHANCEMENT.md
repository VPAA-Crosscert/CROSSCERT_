# Certificate Upload Enhancement - Any Landscape Size Support

## Overview
The certificate upload system has been enhanced to support certificate templates of **any landscape size** (width > height). Previously, there were implicit size restrictions. Now you can upload certificates at any resolution as long as they maintain landscape orientation.

## Key Changes

### 1. **Landscape Orientation Validation** (`backend/certificates/validators.py`)
- New validators ensure certificate templates are properly oriented (landscape)
- Supports multiple image formats: PNG, JPG, JPEG, GIF, BMP, WEBP
- User-friendly error messages guide users to upload the correct orientation

### 2. **Updated Event Model** (`backend/events/models.py`)
- Removed implicit TextField size limitations on `certificate_template_image`
- Added landscape orientation validator
- Added certificate image format validator
- Help text now indicates "Any size is supported"

### 3. **Enhanced EventForm** (`backend/events/forms.py`)
- Added custom `clean_certificate_template_image()` method
- Provides validation feedback during form submission
- Clear error messages if image is not landscape-oriented

### 4. **Dynamic Certificate Generator** (`backend/certificates/generator.py`)
- Now detects template image dimensions automatically
- Generates PDFs with the same dimensions as the template
- Handles images of any size gracefully
- Falls back to standard A4 landscape if template processing fails

### 5. **Updated Form Template** (`backend/templates/events/event_form.html`)
- Clearer instructions: "Any size is supported - just make sure it's wider than it is tall"
- Lists all supported image formats

## Technical Implementation

### Validation Flow
```
File Upload
    ↓
decode_base64_image() - Handles data URLs and base64
    ↓
is_landscape_orientation() - Uses PIL to check dimensions
    ↓
validate_certificate_image_format() - Verifies image format
    ↓
Store as base64 TextField (no size limit)
```

### Certificate Generation Flow
```
Template retrieved as base64
    ↓
_get_page_dimensions_for_template() - Extracts width/height
    ↓
CertificateGenerator initialized with actual dimensions
    ↓
PDF generated with template dimensions
    ↓
Text overlays positioned using provided coordinates
```

## Usage

### For Admin Users
1. Navigate to Event Creation/Edit page
2. Upload a landscape-oriented certificate template
   - Supported formats: PNG, JPG, JPEG, GIF, BMP, WEBP
   - Size: Any landscape dimensions (e.g., 1200x800, 2400x1600, 1000x600)
   - The system will automatically detect the size
3. If portrait or unsupported format, you'll receive a clear error message
4. Set text positions using the coordinate configurator
5. Generate certificates - they'll be created with the template's original dimensions

### For Developers
```python
# Manual certificate generation with custom size
from certificates.generator import CertificateGenerator

generator = CertificateGenerator(template_image=base64_image_data)
pdf_base64 = generator.generate_certificate(
    participant_data={'name': 'John Doe', ...},
    event_data={'title': 'Event Title', ...},
    template_image=base64_image_data,
    coordinates={'name': {'x': 600, 'y': 400}, ...}
)
```

## Database Migration
Run the following after pulling changes:
```bash
python manage.py migrate events
```

This applies the landscape validation to the `certificate_template_image` field.

## Error Handling
- **Portrait Image**: "Certificate template must be in landscape orientation (width > height)."
- **Unsupported Format**: "Unsupported image format: {format}. Supported formats: PNG, JPEG, JPG, GIF, BMP, WEBP"
- **Invalid Image**: "Could not validate certificate template image: {error message}"

## Performance Considerations
- Image dimensions are extracted once during upload (validation + storage)
- PDF generation uses detected dimensions - no scaling penalties
- Base64 encoding maintains data integrity across storage

## Backward Compatibility
- Existing certificates with standard sizes (1123x794) continue to work
- Coordinate systems remain unchanged
- All existing templates automatically supported

## Testing
To test the new functionality:

1. **Landscape Image (Valid)**
   ```
   Image: 1200px × 800px ✓
   Should upload successfully
   ```

2. **Portrait Image (Invalid)**
   ```
   Image: 800px × 1200px ✗
   Should show: "must be in landscape orientation"
   ```

3. **Large Landscape (Valid)**
   ```
   Image: 4800px × 3200px ✓
   Should upload and generate certificates at full resolution
   ```

## Future Enhancements
- Automatic coordinate detection from template image
- Batch template upload support
- Template preview with dimension display
- Coordinate adjustment UI for different template sizes
