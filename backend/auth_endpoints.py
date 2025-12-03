"""
Authentication endpoints for frontend-backend integration.
"""
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.views.decorators.http import require_http_methods
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.contrib.auth.models import User
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
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_staff': user.is_staff,
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
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'is_staff': request.user.is_staff,
                'is_superuser': request.user.is_superuser,
            },
        })
    else:
        return JsonResponse({
            'authenticated': False,
        })
