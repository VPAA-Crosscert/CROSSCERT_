from django.contrib.auth.models import User

# Create admin superuser
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("Created superuser: admin")
else:
    print("Admin user already exists")

# Create staff user for admin panel
if not User.objects.filter(username='admincrosscert').exists():
    user = User.objects.create_user('admincrosscert', 'admincrosscert@gmail.com', 'admincrosscert')
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print("Created staff user: admincrosscert")
else:
    print("admincrosscert user already exists")
