"""
Authentication endpoints for frontend-backend integration.
"""
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.views.decorators.http import require_http_methods
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.contrib.auth.models import User
from participants.models import UserProfile
import json


@require_http_methods(["POST"])
@csrf_exempt
def login_endpoint(request):
    """
    Login endpoint that authenticates user and sets session cookie.
    CSRF exempt because we rely on CORS and origin validation for security.
    
    Expected JSON body:
    {
        "email": "user@example.com",
        "password": "password"
    }
    """
    try:
        data = json.loads(request.body)
        email = data.get('email', '')
        password = data.get('password', '')
        
        # Try to authenticate using email or username
        user = None
        try:
            user = User.objects.get(email=email)
            user = authenticate(request, username=user.username, password=password)
        except User.DoesNotExist:
            user = authenticate(request, username=email, password=password)
        
        if user is not None:
            login(request, user)
            # Set CSRF token in response
            csrf_token = get_token(request)
            
            # Get user profile if it exists
            profile_data = {}
            try:
                profile = user.profile
                profile_data = {
                    'department': profile.department,
                    'program': profile.program,
                    'birthday': profile.birthday.isoformat() if profile.birthday else None,
                }
            except UserProfile.DoesNotExist:
                pass
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'name': user.get_full_name() or user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': user.is_staff,
                    **profile_data,
                },
                'csrf_token': csrf_token,
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Invalid email or password',
            }, status=401)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON',
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def logout_endpoint(request):
    """Logout endpoint that clears session."""
    logout(request)
    return JsonResponse({
        'success': True,
        'message': 'Logged out successfully',
    })


@require_http_methods(["GET"])
def csrf_token_endpoint(request):
    """Get CSRF token endpoint. Ensures CSRF cookie is set."""
    csrf_token = get_token(request)
    return JsonResponse({
        'csrf_token': csrf_token,
    })


@require_http_methods(["GET"])
def current_user_endpoint(request):
    """Get current authenticated user info."""
    if request.user.is_authenticated:
        user = request.user
        # Get user profile if it exists
        profile_data = {}
        try:
            profile = user.profile
            profile_data = {
                'department': profile.department,
                'program': profile.program,
                'birthday': profile.birthday.isoformat() if profile.birthday else None,
            }
        except UserProfile.DoesNotExist:
            pass
        
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'name': user.get_full_name() or user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                **profile_data,
            },
        })
    else:
        return JsonResponse({
            'authenticated': False,
        })
