#!/bin/bash

# Setup Django backend

echo "Creating virtual environment..."
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Creating apps..."
python manage.py startapp events
python manage.py startapp participants
python manage.py startapp certificates

echo "Running migrations..."
python manage.py migrate

echo "Creating superuser..."
python manage.py createsuperuser

echo "Setup complete! Run 'python manage.py runserver' to start the development server."
