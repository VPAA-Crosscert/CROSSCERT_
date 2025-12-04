# Setup Django backend for Windows

Write-Host "Creating virtual environment..." -ForegroundColor Green
python -m venv venv

Write-Host "Activating virtual environment..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1

Write-Host "Upgrading pip..." -ForegroundColor Green
python -m pip install --upgrade pip

Write-Host "Installing dependencies..." -ForegroundColor Green
pip install -r requirements.txt

Write-Host "Running migrations..." -ForegroundColor Green
python manage.py migrate

Write-Host "`nSetup complete!`n" -ForegroundColor Green
Write-Host "To activate the virtual environment in the future, run:" -ForegroundColor Yellow
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "`nTo start the development server, run:" -ForegroundColor Yellow
Write-Host "  python manage.py runserver" -ForegroundColor Cyan
Write-Host "`nTo create a superuser, run:" -ForegroundColor Yellow
Write-Host "  python manage.py createsuperuser" -ForegroundColor Cyan



