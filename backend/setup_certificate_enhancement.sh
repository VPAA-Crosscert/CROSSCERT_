#!/bin/bash
# Quick setup script for certificate upload enhancement

echo "Installing/updating dependencies..."
cd backend
pip install -r requirements.txt

echo "Applying database migrations..."
python manage.py migrate events

echo "Setup complete!"
echo ""
echo "Changes implemented:"
echo "✓ Landscape orientation validation for certificate templates"
echo "✓ Support for any landscape-sized certificate (no size restrictions)"
echo "✓ Automatic dimension detection from template images"
echo "✓ Enhanced form validation with user-friendly error messages"
echo "✓ Updated certificate generator to handle variable sizes"
echo ""
echo "To start the development server:"
echo "  python manage.py runserver"
