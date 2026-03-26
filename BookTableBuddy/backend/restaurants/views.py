from rest_framework import generics, status, permissions
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import Restaurant, Review, Cuisine, Table, RestaurantPhoto, RestaurantHours
from .serializers import (
    RestaurantListSerializer,
    RestaurantDetailSerializer,
    ReviewSerializer,
    CuisineSerializer,
    AvailableTimeSlotSerializer,
    RestaurantPhotoSerializer
)
from bookings.models import Booking

User = get_user_model()

class IsRestaurantManager(permissions.BasePermission):
    """
    Custom permission for restaurant managers
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.RESTAURANT_MANAGER

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission for admin users
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.ADMIN

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a restaurant to edit it
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the restaurant manager
        return obj.manager == request.user

class CuisineListView(generics.ListCreateAPIView):
    """
    API endpoint to list or create cuisine types
    """
    queryset = Cuisine.objects.all()
    serializer_class = CuisineSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class RestaurantSearchView(generics.ListAPIView):
    """
    API endpoint to search restaurants by date, time, party size and location
    """
    serializer_class = RestaurantListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Restaurant.objects.filter(approval_status='approved')
        
        # Get query parameters
        date_str = self.request.query_params.get('date')
        time_str = self.request.query_params.get('time')
        party_size = self.request.query_params.get('party_size')
        city = self.request.query_params.get('city')
        state = self.request.query_params.get('state')
        zip_code = self.request.query_params.get('zip_code')
        cuisine = self.request.query_params.get('cuisine')
        
        # Filter by location if provided
        if city and state:
            queryset = queryset.filter(city__iexact=city, state__iexact=state)
        elif zip_code:
            queryset = queryset.filter(zip_code=zip_code)
        
        # Filter by cuisine if provided
        if cuisine:
            queryset = queryset.filter(cuisine__name__iexact=cuisine)
        
        # If date, time, and party size are provided, check table availability
        if date_str and time_str and party_size:
            try:
                # Parse date and time
                search_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                search_time = datetime.strptime(time_str, '%H:%M').time()
                party_size = int(party_size)
                
                # Get day of week (0=Monday, 6=Sunday)
                day_of_week = search_date.weekday()
                
                # First, filter restaurants that are open at the requested time
                available_restaurants = []
                
                for restaurant in queryset:
                    # Check if restaurant is open on the requested day/time
                    try:
                        hours = restaurant.hours.get(day=day_of_week)
                        if hours.opening_time <= search_time <= hours.closing_time:
                            # Restaurant is open, now check table availability
                            tables = Table.objects.filter(
                                restaurant=restaurant,
                                capacity__gte=party_size
                            )
                            
                            # Get all bookings for this restaurant on the requested date
                            # around the requested time (±30 minutes)
                            search_datetime = datetime.combine(search_date, search_time)
                            time_from = (search_datetime - timedelta(minutes=30)).time()
                            time_to = (search_datetime + timedelta(minutes=30)).time()
                            
                            # Get all tables that are already booked
                            booked_tables = Booking.objects.filter(
                                table__restaurant=restaurant,
                                date=search_date,
                                time__gte=time_from,
                                time__lte=time_to
                            ).values_list('table__id', flat=True)
                            
                            # Check if any tables are available
                            available_tables = tables.exclude(id__in=booked_tables)
                            
                            if available_tables.exists():
                                available_restaurants.append(restaurant.id)
                    except RestaurantHours.DoesNotExist:
                        # Restaurant is not open on this day
                        pass
                
                # Filter queryset to include only restaurants with available tables
                queryset = queryset.filter(id__in=available_restaurants)
                
            except (ValueError, TypeError) as e:
                # Log the error for debugging
                print(f'Error processing search parameters: {e}')
                # Instead of silently returning all restaurants, return an empty queryset
                # This ensures users get accurate results instead of potentially misleading ones
                return Restaurant.objects.none()
        
        return queryset

class AvailableTimeSlotsView(APIView):
    """
    API endpoint to get available time slots for a restaurant on a specific date
    """
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, restaurant_id):
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id, approval_status='approved')
        except Restaurant.DoesNotExist:
            return Response(
                {"error": "Restaurant not found or not approved"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get query parameters
        date_str = request.query_params.get('date')
        party_size = request.query_params.get('party_size')
        
        if not date_str or not party_size:
            return Response(
                {"error": "Date and party_size parameters are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            search_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            party_size = int(party_size)
            
            # Get day of week (0=Monday, 6=Sunday)
            day_of_week = search_date.weekday()
            
            try:
                # Get restaurant hours for this day
                hours = restaurant.hours.get(day=day_of_week)
            except RestaurantHours.DoesNotExist:
                return Response(
                    {"error": "Restaurant is not open on this day"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get all tables that can accommodate the party size
            tables = Table.objects.filter(
                restaurant=restaurant,
                capacity__gte=party_size
            )
            
            if not tables.exists():
                return Response(
                    {"error": "No tables available for this party size"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate time slots at 30-minute intervals
            time_slots = []
            current_time = hours.opening_time
            closing_time = hours.closing_time
            
            # Adjust for time slots that would end after closing
            last_slot_time = datetime.combine(search_date, closing_time) - timedelta(minutes=90)
            last_slot_time = last_slot_time.time()
            
            while current_time <= last_slot_time:
                # For each time slot, check availability
                slot_start = current_time
                slot_end = (datetime.combine(search_date, slot_start) + timedelta(minutes=90)).time()
                
                # Get all bookings for this restaurant in this time slot
                bookings = Booking.objects.filter(
                    table__restaurant=restaurant,
                    date=search_date,
                    time__gte=slot_start,
                    time__lt=slot_end
                )
                
                # Get all tables that are already booked
                booked_table_ids = bookings.values_list('table__id', flat=True)
                
                # Check how many tables are available
                available_tables = tables.exclude(id__in=booked_table_ids).count()
                
                if available_tables > 0:
                    time_slots.append({
                        'time': current_time,
                        'available_tables': available_tables
                    })
                
                # Move to next 30-minute slot
                current_time = (datetime.combine(search_date, current_time) + timedelta(minutes=30)).time()
            
            serializer = AvailableTimeSlotSerializer(time_slots, many=True)
            return Response(serializer.data)
            
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid date or party size format"},
                status=status.HTTP_400_BAD_REQUEST
            )

class RestaurantListCreateView(generics.ListCreateAPIView):
    """
    API endpoint to list all restaurants or create a new one
    """
    serializer_class = RestaurantDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Filter based on user role
        if not user.is_authenticated:
            return Restaurant.objects.filter(approval_status='approved')
        
        if user.role == User.ADMIN:
            # Admins can see all restaurants
            return Restaurant.objects.all()
        elif user.role == User.RESTAURANT_MANAGER:
            # Restaurant managers see their own restaurants
            return Restaurant.objects.filter(manager=user)
        else:
            # Regular customers see only approved restaurants
            return Restaurant.objects.filter(approval_status='approved')
    
    def get_permissions(self):
        if self.request.method == 'POST':
            self.permission_classes = [IsRestaurantManager]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()

class RestaurantDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to retrieve, update or delete a restaurant
    """
    serializer_class = RestaurantDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Filter based on user role
        if not user.is_authenticated:
            return Restaurant.objects.filter(approval_status='approved')
        
        if user.role == User.ADMIN:
            # Admins can see all restaurants
            return Restaurant.objects.all()
        elif user.role == User.RESTAURANT_MANAGER:
            # Restaurant managers see their own restaurants
            return Restaurant.objects.filter(Q(manager=user) | Q(approval_status='approved'))
        else:
            # Regular customers see only approved restaurants
            return Restaurant.objects.filter(approval_status='approved')
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()

class ReviewCreateView(generics.CreateAPIView):
    """
    API endpoint to create a review for a restaurant
    """
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        restaurant_id = self.kwargs.get('restaurant_id')
        restaurant = generics.get_object_or_404(Restaurant, id=restaurant_id, approval_status='approved')
        serializer.save(user=self.request.user, restaurant=restaurant)

class ApproveRestaurantView(APIView):
    """
    API endpoint to approve a restaurant (admin only)
    """
    permission_classes = [IsAdminUser]
    
    def patch(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(pk=pk)
        except Restaurant.DoesNotExist:
            return Response(
                {"error": "Restaurant not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        approval_status = request.data.get('approval_status')
        if approval_status not in ['approved', 'rejected']:
            return Response(
                {"error": "Invalid approval status. Must be 'approved' or 'rejected'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        restaurant.approval_status = approval_status
        restaurant.save()
        
        return Response(
            {"message": f"Restaurant {approval_status} successfully"},
            status=status.HTTP_200_OK
        )

class RestaurantsByManagerView(generics.ListAPIView):
    """
    API endpoint to list restaurants managed by the current user
    """
    serializer_class = RestaurantListSerializer
    permission_classes = [IsRestaurantManager]
    
    def get_queryset(self):
        return Restaurant.objects.filter(manager=self.request.user)

class PendingApprovalRestaurantsView(generics.ListAPIView):
    """
    API endpoint to list restaurants pending approval (admin only)
    """
    serializer_class = RestaurantListSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        return Restaurant.objects.filter(approval_status='pending')

class FlexibleRestaurantSearchView(generics.ListAPIView):
    """
    Enhanced API endpoint to search for available restaurants with time slots.
    
    Returns only approved restaurants that:
    1. Match optional location and cuisine filters
    2. Are open at the requested time
    3. Have tables large enough for the party size
    4. Have at least one table not already booked within ±60 minutes of requested time
    
    For each restaurant, it returns:
    - Basic restaurant information
    - A list of available 30-minute time slots
    
    Query parameters:
    - date: ISO format date (YYYY-MM-DD)
    - time: Time in 24h format (HH:MM)
    - party_size: Number of people in the party
    - location: Text to search in city, state, or zip code
    - cuisine: Cuisine type name
    - price_range: Price range (1-4)
    """
    serializer_class = RestaurantListSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # Start with only approved restaurants
        queryset = Restaurant.objects.filter(approval_status='approved')
        
        # Get query parameters - date, time, party_size required for time slot calculation
        # but the initial restaurant filtering can still work without them
        date_str = self.request.query_params.get('date')
        time_str = self.request.query_params.get('time')
        party_size_str = self.request.query_params.get('party_size')
        location = self.request.query_params.get('location')
        cuisine = self.request.query_params.get('cuisine')
        price_range = self.request.query_params.get('price_range')
        
        # Apply basic filters first to narrow down results
        
        # 1. Location search (can search in city, state, or zip)
        if location:
            location = location.strip()
            queryset = queryset.filter(
                Q(city__icontains=location) | 
                Q(state__icontains=location) | 
                Q(zip_code__icontains=location)
            )
        
        # 2. Cuisine filter
        if cuisine:
            queryset = queryset.filter(cuisine__name__iexact=cuisine)
        
        # 3. Price range filter
        if price_range and price_range.isdigit():
            queryset = queryset.filter(cost_rating=int(price_range))
        
        # Store time slot information in request context for serializer
        self.available_time_slots = {}
        
        # If all needed parameters are provided, filter by table availability
        if date_str and time_str and party_size_str:
            try:
                # Parse date, time and party size
                search_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                requested_time = datetime.strptime(time_str, '%H:%M').time()
                party_size = int(party_size_str)
                
                # Get day of week (0=Monday, 6=Sunday)
                day_of_week = search_date.weekday()
                
                # Restaurants that have available tables
                available_restaurant_ids = []
                
                # Process each restaurant to check availability and generate time slots
                for restaurant in queryset:
                    # First check if restaurant is open on the requested day
                    try:
                        hours = restaurant.hours.get(day=day_of_week)
                        
                        # Skip if restaurant is closed that day
                        if not hours or hours.opening_time >= hours.closing_time:
                            continue
                            
                        # Get tables big enough for the party
                        suitable_tables = Table.objects.filter(
                            restaurant=restaurant,
                            capacity__gte=party_size
                        )
                        
                        # Skip if no tables are big enough
                        if not suitable_tables.exists():
                            continue
                            
                        # Calculate time slots at 30-minute intervals within opening hours
                        opening_datetime = datetime.combine(search_date, hours.opening_time)
                        closing_datetime = datetime.combine(search_date, hours.closing_time)
                        
                        # Generate 30-minute time slots during opening hours
                        time_slots = []
                        current_slot = opening_datetime
                        
                        while current_slot + timedelta(minutes=30) <= closing_datetime:
                            time_slots.append(current_slot.time())
                            current_slot += timedelta(minutes=30)
                            
                        # Get all bookings for this restaurant on the specified date
                        day_bookings = Booking.objects.filter(
                            table__restaurant=restaurant,
                            date=search_date
                        )
                        
                        # For each time slot, check if there are available tables
                        available_slots = []
                        requested_slot_available = False  # Flag for specifically requested time
                        
                        for slot_time in time_slots:
                            # Define booking window for this slot (±60 min)
                            slot_datetime = datetime.combine(search_date, slot_time)
                            window_start = (slot_datetime - timedelta(minutes=60)).time()
                            window_end = (slot_datetime + timedelta(minutes=60)).time()
                            
                            # Find bookings that overlap with this slot's window
                            if window_start <= window_end:  # Normal case (no day boundary crossing)
                                overlapping_bookings = day_bookings.filter(
                                    time__gte=window_start,
                                    time__lte=window_end
                                )
                            else:  # Window crosses midnight
                                overlapping_bookings = day_bookings.filter(
                                    Q(time__gte=window_start) | Q(time__lte=window_end)
                                )
                            
                            # Get IDs of tables that are already booked in this window
                            booked_table_ids = overlapping_bookings.values_list('table__id', flat=True)
                            
                            # Get tables that are free during this slot
                            free_tables = suitable_tables.exclude(id__in=booked_table_ids)
                            free_table_count = free_tables.count()
                            
                            # If we have available tables for this slot
                            if free_table_count > 0:
                                # Format time as string (HH:MM)
                                slot_str = slot_time.strftime('%H:%M')
                                available_slots.append({
                                    'time': slot_str,
                                    'available_tables': free_table_count
                                })
                                
                                # Check if this slot contains the specifically requested time
                                slot_end = (slot_datetime + timedelta(minutes=30)).time()
                                if slot_time <= requested_time < slot_end:
                                    requested_slot_available = True
                        
                        # Restaurant is viable if it has any available slots
                        # AND the specifically requested time slot is available
                        if available_slots and requested_slot_available:
                            available_restaurant_ids.append(restaurant.id)
                            self.available_time_slots[restaurant.id] = available_slots
                            
                    except RestaurantHours.DoesNotExist:
                        # Restaurant doesn't have hours for this day - skip it
                        continue
                
                # Filter to only show restaurants with available slots
                queryset = queryset.filter(id__in=available_restaurant_ids)
                
            except (ValueError, TypeError) as e:
                # Log error and return empty queryset
                print(f'Error processing search parameters: {e}')
                return Restaurant.objects.none()
                
        # Return the final queryset
        return queryset.distinct()
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        
        # Add available time slots to context so serializer can access them
        if hasattr(self, 'available_time_slots'):
            context['available_time_slots'] = self.available_time_slots
            
        return context


class BulkPhotoUploadView(APIView):
    """
    API endpoint to upload multiple photos at once for a restaurant
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, restaurant_id):
        # Get the restaurant
        restaurant = get_object_or_404(Restaurant, pk=restaurant_id)
        
        # Check permissions - only restaurant manager or admin can upload photos
        if not (request.user.is_staff or request.user == restaurant.manager):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Initialize counter for successful uploads
        successful_uploads = 0
        created_photos = []
        errors = []
        
        # Process photos using the photos[index][image] format
        # First check if we have any photos in this format
        has_photos = False
        for key in request.FILES.keys():
            if key.startswith('photos[') and key.endswith('][image]'):
                has_photos = True
                break
        
        if has_photos:
            # Extract all indices from the keys
            indices = set()
            for key in request.FILES.keys():
                if key.startswith('photos[') and key.endswith('][image]'):
                    # Extract the index from the key format photos[index][image]
                    index = key[7:-8]  # remove 'photos[' from start and '][image]' from end
                    if index.isdigit():
                        indices.add(int(index))
            
            # Process each photo in order
            for i in sorted(indices):
                image = request.FILES.get(f'photos[{i}][image]')
                caption = request.data.get(f'photos[{i}][caption]', 'Restaurant Photo')
                is_primary_str = request.data.get(f'photos[{i}][is_primary]', 'false')
                is_primary = is_primary_str.lower() == 'true'
                
                # Make first photo primary if no primary photos exist
                if successful_uploads == 0 and not RestaurantPhoto.objects.filter(restaurant=restaurant, is_primary=True).exists():
                    is_primary = True
                
                # Create the photo if we have a valid image file
                if image and hasattr(image, 'name'):
                    try:
                        photo = RestaurantPhoto.objects.create(
                            restaurant=restaurant,
                            image=image,
                            caption=caption,
                            is_primary=is_primary
                        )
                        created_photos.append({
                            'id': photo.id,
                            'caption': photo.caption,
                            'is_primary': photo.is_primary,
                            'success': True
                        })
                        successful_uploads += 1
                    except Exception as e:
                        errors.append({
                            'index': i,
                            'error': str(e)
                        })
                else:
                    errors.append({
                        'index': i,
                        'error': 'Invalid or missing image file'
                    })
        else:
            # Support legacy format for backward compatibility
            for i in range(10):  # Reasonable limit for number of photos
                key = f'photos_file_{i}'
                if key in request.FILES:
                    image = request.FILES.get(key)
                    caption = request.data.get(f'photos_caption_{i}', 'Restaurant Photo')
                    is_primary_str = request.data.get(f'photos_is_primary_{i}', 'false')
                    is_primary = is_primary_str.lower() == 'true'
                    
                    # Make first photo primary if no primary photos exist
                    if successful_uploads == 0 and not RestaurantPhoto.objects.filter(restaurant=restaurant, is_primary=True).exists():
                        is_primary = True
                    
                    try:
                        photo = RestaurantPhoto.objects.create(
                            restaurant=restaurant,
                            image=image,
                            caption=caption,
                            is_primary=is_primary
                        )
                        created_photos.append({
                            'id': photo.id,
                            'caption': photo.caption,
                            'is_primary': photo.is_primary,
                            'success': True
                        })
                        successful_uploads += 1
                    except Exception as e:
                        errors.append({
                            'index': i,
                            'error': str(e)
                        })
                else:
                    # No more photos to process
                    break
        
        # Return the results
        result = {
            'successful_uploads': successful_uploads,
            'photos': created_photos
        }
        
        if errors:
            result['errors'] = errors
        
        if successful_uploads > 0:
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            if errors:
                result['message'] = 'No photos were uploaded successfully'
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': 'No photos provided'}, status=status.HTTP_400_BAD_REQUEST)
