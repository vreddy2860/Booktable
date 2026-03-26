from rest_framework import serializers
from django.db.models import Avg
from .models import Restaurant, Cuisine, RestaurantHours, Table, Review, RestaurantPhoto
from bookings.models import Booking
from django.utils import timezone
from datetime import timedelta

class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = '__all__'

class RestaurantHoursSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_display', read_only=True)
    
    class Meta:
        model = RestaurantHours
        fields = ['id', 'day', 'day_name', 'opening_time', 'closing_time']
        extra_kwargs = {
            'id': {'read_only': True}
        }

class TableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = ['id', 'table_number', 'capacity']
        extra_kwargs = {
            'id': {'read_only': True}
        }

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'rating', 'comment', 'created_at', 'user', 'user_name']
        extra_kwargs = {
            'id': {'read_only': True},
            'created_at': {'read_only': True},
            'user': {'read_only': True}
        }
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class RestaurantPhotoSerializer(serializers.ModelSerializer):
    # Add a custom field for the relative URL
    image_path = serializers.SerializerMethodField()
    
    class Meta:
        model = RestaurantPhoto
        fields = ['id', 'image', 'image_path', 'caption', 'is_primary']
        extra_kwargs = {
            'id': {'read_only': True},
            'image': {'required': True, 'write_only': True}  # Make image write-only as we'll use image_path for reading
        }
    
    def get_image_path(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            # Get just the relative path, removing the domain part
            url = obj.image.url
            # Return the path starting with /media/
            if url.startswith('http'):
                # Extract the path part from absolute URL
                from urllib.parse import urlparse
                parsed = urlparse(url)
                return parsed.path
            return url

    def create(self, validated_data):
        # Ensure image field contains a proper file object, not a dict
        if 'image' in validated_data and isinstance(validated_data['image'], dict):
            # If we got a dict instead of a file, log it and remove it to prevent errors
            print(f"Warning: Received a dict instead of a file object for image")
            validated_data.pop('image')
            
        # Continue with creation if we have valid data
        return super().create(validated_data)
        
    def validate_image(self, value):
        # Add validation to ensure we have a proper file
        if value and not (hasattr(value, 'read') or hasattr(value, 'file')):
            raise serializers.ValidationError("Invalid image file. Please upload a valid image.")
        return value

class RestaurantListSerializer(serializers.ModelSerializer):
    cuisine = CuisineSerializer(many=True, read_only=True)
    primary_photo = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    bookings_today = serializers.SerializerMethodField()
    cost_rating_display = serializers.CharField(source='get_cost_rating_display', read_only=True)
    available_time_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'description', 'address', 'city', 'state', 'zip_code',
            'cuisine', 'cost_rating', 'cost_rating_display', 'average_rating',
            'primary_photo', 'bookings_today', 'approval_status', 'available_time_slots'
        ]
    
    def get_primary_photo(self, obj):
        try:
            photo = obj.photos.filter(is_primary=True).first()
            if not photo:
                photo = obj.photos.first()  # Fallback to first photo if no primary photo
                
            if not photo:
                return None
                
            # Create a custom dictionary with both the image and a relative path
            return {
                'id': photo.id,
                'image': photo.image.url if photo.image and hasattr(photo.image, 'url') else None,
                'image_path': photo.image.url if photo.image and hasattr(photo.image, 'url') else None,
                'caption': photo.caption,
                'is_primary': photo.is_primary
            }
        except Exception as e:
            print(f"Error getting primary photo: {str(e)}")
        return None
    
    def get_average_rating(self, obj):
        return obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
    
    def get_bookings_today(self, obj):
        today = timezone.now().date()
        return Booking.objects.filter(
            table__restaurant=obj,
            date=today
        ).count()
    
    def get_available_time_slots(self, obj):
        """
        Retrieve available time slots for this restaurant from the view context.
        Each time slot contains the time (HH:MM) and number of available tables.
        """
        # Check if we have time slot data in the context
        context = self.context.get('available_time_slots', {})
        
        # Return time slots for this restaurant, or empty list if none
        return context.get(obj.id, [])

class RestaurantDetailSerializer(serializers.ModelSerializer):
    cuisine = CuisineSerializer(many=True)
    hours = RestaurantHoursSerializer(many=True)
    tables = TableSerializer(many=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    photos = RestaurantPhotoSerializer(many=True, required=False)
    manager_name = serializers.CharField(source='manager.username', read_only=True)
    average_rating = serializers.SerializerMethodField()
    bookings_today = serializers.SerializerMethodField()
    cost_rating_display = serializers.CharField(source='get_cost_rating_display', read_only=True)
    
    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'description', 'address', 'city', 'state', 'zip_code',
            'phone', 'email', 'website', 'cuisine', 'cost_rating', 'cost_rating_display',
            'latitude', 'longitude', 'manager', 'manager_name', 'approval_status',
            'hours', 'tables', 'reviews', 'photos', 'average_rating', 'bookings_today',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['manager', 'created_at', 'updated_at']
    
    def get_average_rating(self, obj):
        return obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0
    
    def get_bookings_today(self, obj):
        today = timezone.now().date()
        return Booking.objects.filter(
            table__restaurant=obj,
            date=today
        ).count()
    
    def create(self, validated_data):
        # Extract nested data
        cuisine_data = validated_data.pop('cuisine', [])
        hours_data = validated_data.pop('hours', [])
        tables_data = validated_data.pop('tables', [])
        photos_data = validated_data.pop('photos', [])
        
        # Set the manager to the current user
        validated_data['manager'] = self.context['request'].user
        
        # Create the restaurant
        restaurant = Restaurant.objects.create(**validated_data)
        
        # Add cuisines
        for cuisine in cuisine_data:
            cuisine_obj, _ = Cuisine.objects.get_or_create(name=cuisine['name'])
            restaurant.cuisine.add(cuisine_obj)
        
        # Add hours
        for hour_data in hours_data:
            RestaurantHours.objects.create(restaurant=restaurant, **hour_data)
        
        # Add tables
        for table_data in tables_data:
            Table.objects.create(restaurant=restaurant, **table_data)
        
        # Add photos
        for photo_data in photos_data:
            RestaurantPhoto.objects.create(restaurant=restaurant, **photo_data)
        
        return restaurant
    
    def update(self, instance, validated_data):
        # Extract nested data
        cuisine_data = validated_data.pop('cuisine', None)
        hours_data = validated_data.pop('hours', None)
        tables_data = validated_data.pop('tables', None)
        photos_data = validated_data.pop('photos', None)
        
        # Update the restaurant instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update cuisines if provided
        if cuisine_data is not None:
            instance.cuisine.clear()
            for cuisine in cuisine_data:
                cuisine_obj, _ = Cuisine.objects.get_or_create(name=cuisine['name'])
                instance.cuisine.add(cuisine_obj)
        
        # Update hours if provided
        if hours_data is not None:
            instance.hours.all().delete()
            for hour_data in hours_data:
                RestaurantHours.objects.create(restaurant=instance, **hour_data)
        
        # Update tables if provided
        if tables_data is not None:
            instance.tables.all().delete()
            for table_data in tables_data:
                Table.objects.create(restaurant=instance, **table_data)
        
        # Update photos if provided
        if photos_data is not None:
            # Only process photos with actual file uploads
            for photo_data in photos_data:
                if 'image' in photo_data and hasattr(photo_data['image'], 'file'):
                    # Create a new photo with the uploaded file
                    RestaurantPhoto.objects.create(restaurant=instance, **photo_data)
                    
        # Check for direct photo upload fields
        request = self.context.get('request')
        if request and request.data:
            # Check for the multiple photo file uploads format
            photos_file_count = request.data.get('photos_file_count', '0')
            
            try:
                photo_count = int(photos_file_count)
                print(f'Processing {photo_count} uploaded photo files')
                
                # If primary photo is not set for this restaurant yet, make first uploaded photo primary
                make_first_primary = not instance.photos.filter(is_primary=True).exists()
                
                for i in range(photo_count):
                    photo_key = f'photos_file_{i}'
                    caption_key = f'photos_caption_{i}'
                    is_primary_key = f'photos_is_primary_{i}'
                    
                    if photo_key in request.data:
                        photo_file = request.data.get(photo_key)
                        caption = request.data.get(caption_key, '')
                        is_primary_str = request.data.get(is_primary_key, 'false')
                        is_primary = is_primary_str.lower() == 'true' or (i == 0 and make_first_primary)
                        
                        print(f'Creating photo {i+1}/{photo_count}: caption={caption}, is_primary={is_primary}')
                        
                        # Make sure we're handling a real file, not a dict
                        if hasattr(photo_file, 'file') or hasattr(photo_file, 'read'):
                            # Log what we're receiving
                            print(f'Photo file type: {type(photo_file)}')
                            print(f'Photo file name: {getattr(photo_file, "name", "No name")}')
                            print(f'Photo file size: {getattr(photo_file, "size", "No size")}')
                            
                            # Create a new photo with the uploaded file
                            RestaurantPhoto.objects.create(
                                restaurant=instance,
                                image=photo_file,
                                caption=caption,
                                is_primary=is_primary
                            )
                        else:
                            print(f'Warning: photo_file is not a proper file object, it\'s a {type(photo_file)}')
                    else:
                        print(f'Photo file {i} not found in request data')
            except ValueError:
                print(f'Invalid photos_file_count value: {photos_file_count}')
            
            # Also handle the single photo upload format for backward compatibility
            if 'photos_file' in request.data:
                photo_file = request.data.get('photos_file')
                caption = request.data.get('photos_caption', '')
                is_primary_str = request.data.get('photos_is_primary', 'false')
                is_primary = is_primary_str.lower() == 'true' or (make_first_primary)
                
                # Make sure we're handling a real file, not a dict
                if hasattr(photo_file, 'file') or hasattr(photo_file, 'read'):
                    # Log what we're receiving
                    print(f'Single photo upload - file type: {type(photo_file)}')
                    print(f'Single photo upload - name: {getattr(photo_file, "name", "No name")}')
                    
                    # Create a new photo with the uploaded file
                    RestaurantPhoto.objects.create(
                        restaurant=instance,
                        image=photo_file,
                        caption=caption,
                        is_primary=is_primary
                    )
                else:
                    print(f"Warning: Single photo upload - photo_file is not a proper file object, it's a {type(photo_file)}")
        
        return instance

class AvailableTimeSlotSerializer(serializers.Serializer):
    time = serializers.TimeField()
    available_tables = serializers.IntegerField()
