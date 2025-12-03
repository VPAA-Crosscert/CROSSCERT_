# Quick Reference: Certificate Upload Enhancement

## What Changed?
✅ **You can now upload certificate templates of ANY landscape size**

Previously: Limited to specific sizes  
Now: Any landscape orientation (width > height) is supported

## How to Use

### For Creating/Editing Events
1. Go to Event Creation page
2. Upload certificate template:
   - **Must be landscape** (wider than tall)
   - **Any size** works (1200×800, 2400×1600, 4K, etc.)
   - **Formats**: PNG, JPG, JPEG, GIF, BMP, WEBP
3. Set text positions as usual
4. Save - PDFs will be generated at the template's original size

### Example Valid Sizes
- 1000 × 600 pixels
- 1200 × 800 pixels
- 1920 × 1080 pixels (HD)
- 2560 × 1440 pixels (2K)
- 3840 × 2160 pixels (4K)
- Any landscape dimensions you need!

## Error Messages & Solutions

### ❌ "Must be in landscape orientation"
**Issue**: Image is taller than it is wide  
**Solution**: Rotate image so it's wider than tall, or use landscape template

### ❌ "Unsupported image format"
**Issue**: Wrong file type  
**Solution**: Use PNG, JPG, JPEG, GIF, BMP, or WEBP

### ❌ "Could not validate certificate template"
**Issue**: Image is corrupted or not readable  
**Solution**: Re-export/save image and try again

## No Action Needed If
✓ You have existing events - they still work  
✓ Your coordinates are set - no changes needed  
✓ Standard size templates - continue as normal  

## Behind the Scenes
- System auto-detects template dimensions
- PDFs generated at exact template size
- No scaling or resizing needed
- Better quality at all sizes

## Support
For issues, check:
1. Is certificate landscape? (width > height)
2. Is format supported? (PNG, JPG, JPEG, GIF, BMP, WEBP)
3. Is image file not corrupted?

If still having issues, see `CERTIFICATE_UPLOAD_ENHANCEMENT.md` for details.

---
**Status**: ✓ Ready to use  
**Tested**: ✓ All formats and sizes  
**Backward Compatible**: ✓ Yes
