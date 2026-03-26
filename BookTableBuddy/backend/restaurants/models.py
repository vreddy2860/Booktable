from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Cuisine(models.Model):
    """
    Model for restaurant cuisine types
    """
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class Restaurant(models.Model):
    """
    Model for restaurant information
    """
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    COST_RATING_CHOICES = [
        (1, '$'),
        (2, '$$'),
        (3, '$$$'),
        (4, '$$$$'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    website = models.URLField(blank=True, null=True)
    
    cuisine = models.ManyToManyField(Cuisine, related_name='restaurants')
    cost_rating = models.IntegerField(choices=COST_RATING_CHOICES, default=2)
    
    # Location for maps
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    
    # Restaurant manager
    manager = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='restaurants',
        limit_choices_to={'role': User.RESTAURANT_MANAGER}
    )
    
    # Approval status
    approval_status = models.CharField(
        max_length=10,
        choices=APPROVAL_STATUS_CHOICES,
        default='pending'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

def restaurant_photo_path(instance, filename):
    """Function to return custom path for restaurant photos"""
    # Get file extension
    import os
    import time
    ext = os.path.splitext(filename)[1]
    # Create clean restaurant name (remove spaces, special chars)
    restaurant_name = ''.join(c for c in instance.restaurant.name if c.isalnum()).lower()
    timestamp = int(time.time())
    # Return path with custom filename
    return f'restaurant_photos/{restaurant_name}_{timestamp}{ext}'

def restaurant_image_path(instance, filename):
    """Function to return custom path for main restaurant image"""
    # Get file extension
    import os
    import time
    ext = os.path.splitext(filename)[1]
    # Create clean restaurant name (remove spaces, special chars)
    restaurant_name = ''.join(c for c in instance.name if c.isalnum()).lower()
    timestamp = int(time.time())
    # Return path with custom filename
    return f'restaurant_images/{restaurant_name}_{timestamp}{ext}'
    
class RestaurantPhoto(models.Model):
    """Model for restaurant photos - manually uploaded by restaurant manager"""
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to=restaurant_photo_path)
    caption = models.CharField(max_length=200, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Photo for {self.restaurant.name}"
        
    def save(self, *args, **kwargs):
        """Override save to handle primary photo status and ensure directory exists"""
        # Make sure the restaurant_photos directory exists
        import os
        from django.conf import settings
        os.makedirs(os.path.join(settings.MEDIA_ROOT, 'restaurant_photos'), exist_ok=True)
            
        # If this is the first photo, make it primary by default
        if not self.pk and not RestaurantPhoto.objects.filter(restaurant=self.restaurant).exists():
            self.is_primary = True
            
        # Save the photo first
        super().save(*args, **kwargs)
        
        # Ensure there's only one primary photo per restaurant
        if self.is_primary:
            # Set all other photos for this restaurant to not be primary
            RestaurantPhoto.objects.filter(
                restaurant=self.restaurant, 
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)

class RestaurantHours(models.Model):
    """
    Model for restaurant operating hours
    """
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='hours')
    day = models.IntegerField(choices=DAY_CHOICES)
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    
    class Meta:
        unique_together = ('restaurant', 'day')
        ordering = ['day']
    
    def __str__(self):
        return f"{self.restaurant.name} - {self.get_day_display()}"

class Table(models.Model):
    """
    Model for restaurant tables
    """
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='tables')
    table_number = models.CharField(max_length=10)
    capacity = models.IntegerField()
    
    class Meta:
        unique_together = ('restaurant', 'table_number')
    
    def __str__(self):
        return f"{self.restaurant.name} - Table {self.table_number} (Capacity: {self.capacity})"

class Review(models.Model):
    """
    Model for restaurant reviews
    """
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(1, '1'), (2, '2'), (3, '3'), (4, '4'), (5, '5')])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('restaurant', 'user')
    
    def __str__(self):
        return f"Review for {self.restaurant.name} by {self.user.username}"
