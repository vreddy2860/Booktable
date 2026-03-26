from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import os
from django.conf import settings
from pathlib import Path

def test_upload_form(request):
    """Serve the HTML test form"""
    template_path = Path(__file__).resolve().parent / 'templates' / 'test_upload.html'
    
    # Create templates directory if it doesn't exist
    os.makedirs(os.path.dirname(template_path), exist_ok=True)
    
    # Create media directory structure if it doesn't exist
    os.makedirs(os.path.join(settings.MEDIA_ROOT, 'restaurant_photos'), exist_ok=True)
    os.makedirs(os.path.join(settings.MEDIA_ROOT, 'test_uploads'), exist_ok=True)
    
    # Manually serving the HTML file since we're not using Django templates
    if os.path.exists(template_path):
        with open(template_path, 'r') as f:
            html_content = f.read()
            return HttpResponse(html_content)
    else:
        return HttpResponse(f"Template not found at {template_path}")

@csrf_exempt
def test_file_upload(request):
    """Test view for file uploads that writes directly to disk"""
    # For GET requests, serve the upload form
    if request.method == 'GET':
        return test_upload_form(request)
    
    # For POST requests, handle file upload
    if request.method == 'POST' and request.FILES.get('test_image'):
        # Get the uploaded file
        uploaded_file = request.FILES['test_image']
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'test_uploads'), exist_ok=True)
        
        # Save file directly to disk
        file_path = os.path.join(settings.MEDIA_ROOT, 'test_uploads', uploaded_file.name)
        
        # Debug info
        debug_info = {
            'file_name': uploaded_file.name,
            'file_size': uploaded_file.size,
            'content_type': uploaded_file.content_type,
            'target_path': file_path,
            'media_root': settings.MEDIA_ROOT,
            'media_url': settings.MEDIA_URL,
        }
        
        try:
            # Directly write the file to disk
            with open(file_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
                    
            # Check if the file exists after saving
            file_exists = os.path.exists(file_path)
            file_size = os.path.getsize(file_path) if file_exists else 0
            
            # Return success response
            return JsonResponse({
                'success': True,
                'message': 'File uploaded successfully',
                'path': file_path,
                'url': f'{settings.MEDIA_URL}test_uploads/{uploaded_file.name}',
                'file_exists': file_exists,
                'file_size': file_size,
                'debug': debug_info
            })
        except Exception as e:
            # Return error response
            return JsonResponse({
                'success': False,
                'error': str(e),
                'debug': debug_info
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'message': 'No file provided or invalid request method'
    }, status=400)
