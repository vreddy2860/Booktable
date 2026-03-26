"""
URL configuration for booktable project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.conf.urls.static import static

def api_index(request):
    """
    Simple view to render the API index
    """
    api_endpoints = {
        'endpoints': {
            'authentication': '/api/users/login/ and /api/users/register/',
            'restaurants': '/api/restaurants/',
            'bookings': '/api/bookings/',
            'analytics': '/api/analytics/',
        },
        'documentation': 'BookTable API - Similar to OpenTable',
        'version': '1.0'
    }
    return JsonResponse(api_endpoints)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', api_index, name='api_index'),  # Root URL handler
    path('api/restaurants/', include('restaurants.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/users/', include('users.urls')),
    path('api/analytics/', include('analytics.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
