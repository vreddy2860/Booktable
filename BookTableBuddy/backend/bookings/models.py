from django.db import models
from django.contrib.auth import get_user_model
from restaurants.models import Table
from django.core.exceptions import ValidationError
from django.utils import timezone

User = get_user_model()

class Booking(models.Model):
    """
    Model for restaurant table bookings
    """
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='bookings')
    date = models.DateField()
    time = models.TimeField()
    party_size = models.IntegerField()
    special_requests = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    
    # Contact information
    contact_name = models.CharField(max_length=100)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=15)
    
    # Booking reference and timestamps
    booking_reference = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-time']
        # Add a unique constraint to prevent double bookings
        constraints = [
            models.UniqueConstraint(
                fields=['table', 'date', 'time', 'status'],
                condition=models.Q(status='confirmed'),
                name='unique_confirmed_booking'
            )
        ]
    
    def __str__(self):
        return f"{self.booking_reference} - {self.table.restaurant.name} - {self.date} {self.time}"
    
    def clean(self):
        """
        Custom validation to check if the table is already booked around the requested time
        """
        if self.status == 'confirmed':
            # Check if the table is already booked within 1.5 hours of the requested time
            booking_datetime = timezone.make_aware(
                timezone.datetime.combine(self.date, self.time)
            )
            start_check = booking_datetime - timezone.timedelta(hours=1, minutes=30)
            end_check = booking_datetime + timezone.timedelta(hours=1, minutes=30)
            
            overlapping_bookings = Booking.objects.filter(
                table=self.table,
                date=self.date,
                status='confirmed'
            ).exclude(id=self.id)
            
            for booking in overlapping_bookings:
                booking_time = timezone.make_aware(
                    timezone.datetime.combine(booking.date, booking.time)
                )
                if start_check <= booking_time <= end_check:
                    raise ValidationError(
                        f"This table is already booked at {booking.time} on {booking.date}."
                    )
            
            # Check if the party size exceeds the table capacity
            if self.party_size > self.table.capacity:
                raise ValidationError(
                    f"This table can only accommodate {self.table.capacity} people."
                )
    
    def save(self, *args, **kwargs):
        """
        Generate a unique booking reference if not provided
        """
        if not self.booking_reference:
            import random
            import string
            
            # Generate a random 8-character reference
            chars = string.ascii_uppercase + string.digits
            reference = ''.join(random.choice(chars) for _ in range(8))
            
            # Make sure it's unique
            while Booking.objects.filter(booking_reference=reference).exists():
                reference = ''.join(random.choice(chars) for _ in range(8))
            
            self.booking_reference = reference
        
        self.clean()
        super().save(*args, **kwargs)
