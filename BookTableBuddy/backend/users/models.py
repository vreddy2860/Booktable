from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """
    Custom User model with role-based permissions
    """
    CUSTOMER = 'customer'
    RESTAURANT_MANAGER = 'restaurant_manager'
    ADMIN = 'admin'
    
    ROLE_CHOICES = [
        (CUSTOMER, 'Customer'),
        (RESTAURANT_MANAGER, 'Restaurant Manager'),
        (ADMIN, 'Admin'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=CUSTOMER,
    )
    
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    
    def is_customer(self):
        return self.role == self.CUSTOMER
    
    def is_restaurant_manager(self):
        return self.role == self.RESTAURANT_MANAGER
    
    def is_admin_user(self):
        return self.role == self.ADMIN
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
