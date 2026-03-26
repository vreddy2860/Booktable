"""
WSGI config for booktable project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'booktable.settings')

application = get_wsgi_application()
