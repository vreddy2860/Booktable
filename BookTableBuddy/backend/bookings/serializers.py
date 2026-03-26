from rest_framework import serializers
from .models import Booking
from restaurants.models import Table, Restaurant
from django.utils import timezone
from datetime import timedelta

class BookingSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='table.restaurant.name', read_only=True)
    restaurant_id = serializers.IntegerField(source='table.restaurant.id', read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'table', 'date', 'time', 'party_size', 'special_requests',
            'status', 'contact_name', 'contact_email', 'contact_phone',
            'booking_reference', 'created_at', 'updated_at',
            'restaurant_name', 'restaurant_id', 'table_number'
        ]
        read_only_fields = ['user', 'booking_reference', 'created_at', 'updated_at']
    
    def validate(self, data):
        table = data.get('table')
        date = data.get('date')
        time = data.get('time')
        party_size = data.get('party_size')
        status = data.get('status', 'confirmed')
        
        if status == 'confirmed':
            # Validate party size against table capacity
            if party_size > table.capacity:
                raise serializers.ValidationError(
                    f"This table can only accommodate {table.capacity} people."
                )
            
            # Validate table availability
            booking_datetime = timezone.datetime.combine(date, time)
            start_check = (booking_datetime - timedelta(hours=1, minutes=30)).time()
            end_check = (booking_datetime + timedelta(hours=1, minutes=30)).time()
            
            # Get all confirmed bookings for this table on this date
            from .models import Booking
            existing_bookings = Booking.objects.filter(
                table=table,
                date=date,
                status='confirmed'
            )
            
            if self.instance:
                existing_bookings = existing_bookings.exclude(id=self.instance.id)
            
            for booking in existing_bookings:
                if start_check <= booking.time <= end_check:
                    raise serializers.ValidationError(
                        f"This table is already booked at {booking.time} on {date}."
                    )
            
            # Validate that the restaurant is open at this time
            restaurant = table.restaurant
            day_of_week = date.weekday()  # 0 = Monday, 6 = Sunday
            
            try:
                hours = restaurant.hours.get(day=day_of_week)
                if not (hours.opening_time <= time <= hours.closing_time):
                    raise serializers.ValidationError(
                        f"The restaurant is not open at {time} on this day."
                    )
            except restaurant.hours.model.DoesNotExist:
                raise serializers.ValidationError(
                    "The restaurant is not open on this day."
                )
        
        return data
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class BookingCreateSerializer(serializers.Serializer):
    """
    Serializer for creating a booking without specifying a table directly
    """
    restaurant_id = serializers.IntegerField()
    date = serializers.DateField()
    time = serializers.TimeField()
    party_size = serializers.IntegerField(min_value=1)
    special_requests = serializers.CharField(required=False, allow_blank=True)
    contact_name = serializers.CharField(max_length=100)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(max_length=15)
    
    def validate(self, data):
        restaurant_id = data.get('restaurant_id')
        date = data.get('date')
        time = data.get('time')
        party_size = data.get('party_size')
        
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id, approval_status='approved')
        except Restaurant.DoesNotExist:
            raise serializers.ValidationError("Restaurant not found or not approved.")
        
        # Validate that the restaurant is open at this time
        day_of_week = date.weekday()  # 0 = Monday, 6 = Sunday
        
        try:
            hours = restaurant.hours.get(day=day_of_week)
            if not (hours.opening_time <= time <= hours.closing_time):
                raise serializers.ValidationError(
                    f"The restaurant is not open at {time} on this day."
                )
        except restaurant.hours.model.DoesNotExist:
            raise serializers.ValidationError(
                "The restaurant is not open on this day."
            )
        
        # Find an available table
        booking_datetime = timezone.datetime.combine(date, time)
        start_check = (booking_datetime - timedelta(hours=1, minutes=30)).time()
        end_check = (booking_datetime + timedelta(hours=1, minutes=30)).time()
        
        # Get tables that can accommodate the party size
        tables = Table.objects.filter(
            restaurant=restaurant,
            capacity__gte=party_size
        )
        
        if not tables.exists():
            raise serializers.ValidationError(
                f"No tables available for a party of {party_size}."
            )
        
        # Get all bookings for this restaurant at this time
        from .models import Booking
        existing_bookings = Booking.objects.filter(
            table__restaurant=restaurant,
            date=date,
            status='confirmed'
        )
        
        # Find tables that are not booked
        available_tables = []
        for table in tables:
            is_available = True
            for booking in existing_bookings.filter(table=table):
                if start_check <= booking.time <= end_check:
                    is_available = False
                    break
            
            if is_available:
                available_tables.append(table)
        
        if not available_tables:
            raise serializers.ValidationError(
                "No tables available at this time. Please try a different time."
            )
        
        # Store the available table to use in create method
        data['available_table'] = available_tables[0]
        return data
    
    def create(self, validated_data):
        table = validated_data.pop('available_table')
        restaurant_id = validated_data.pop('restaurant_id')
        
        from .models import Booking
        booking = Booking.objects.create(
            user=self.context['request'].user,
            table=table,
            **validated_data
        )
        
        return booking
