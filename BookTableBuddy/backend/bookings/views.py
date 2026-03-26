from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q

from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer
from restaurants.models import Restaurant, Table

User = get_user_model()

class IsRestaurantManagerForBooking(permissions.BasePermission):
    """
    Custom permission for restaurant managers to access their restaurant's bookings
    """
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and (
            request.user.role == User.RESTAURANT_MANAGER and 
            obj.table.restaurant.manager == request.user
        )

class IsBookingOwner(permissions.BasePermission):
    """
    Custom permission for users to access only their own bookings
    """
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and obj.user == request.user

# Import our notification modules
from .notifications import send_booking_confirmation
from .sms_notifications import send_booking_confirmation_sms

class BookingCreateView(generics.CreateAPIView):
    """
    API endpoint to create a new booking
    """
    serializer_class = BookingCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        
        # Return the full booking details
        response_serializer = BookingSerializer(booking)
        headers = self.get_success_headers(response_serializer.data)
        
        # Send confirmation email using our notifications module
        try:
            send_booking_confirmation(booking)
            print(f"Confirmation email sent for booking {booking.id}")
        except Exception as e:
            print(f"Error sending confirmation email: {str(e)}")
            
        # Send confirmation SMS if phone number is available
        if hasattr(booking, 'contact_phone') and booking.contact_phone:
            try:
                send_booking_confirmation_sms(booking)
                print(f"Confirmation SMS sent for booking {booking.id}")
            except Exception as e:
                print(f"Error sending confirmation SMS: {str(e)}")
        
        return Response(
            response_serializer.data, 
            status=status.HTTP_201_CREATED, 
            headers=headers
        )

class UserBookingsListView(generics.ListAPIView):
    """
    API endpoint to list bookings for the current user
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to retrieve, update or cancel a booking
    """
    serializer_class = BookingSerializer
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            self.permission_classes = [permissions.IsAuthenticated, IsBookingOwner]
        else:
            self.permission_classes = [permissions.IsAuthenticated, 
                                      permissions.OR(IsBookingOwner, IsRestaurantManagerForBooking)]
        return super().get_permissions()
    
    def get_queryset(self):
        user = self.request.user
        
        # Filter based on user role
        if user.role == User.ADMIN:
            # Admins can see all bookings
            return Booking.objects.all()
        elif user.role == User.RESTAURANT_MANAGER:
            # Restaurant managers see bookings for their restaurants
            return Booking.objects.filter(table__restaurant__manager=user)
        else:
            # Regular customers see only their own bookings
            return Booking.objects.filter(user=user)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Only allow updating status to 'cancelled' for regular users
        if request.user.role == User.CUSTOMER and 'status' in request.data:
            if request.data['status'] != 'cancelled':
                return Response(
                    {"error": "You can only cancel a booking, not change its status to anything else."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

class RestaurantBookingsView(generics.ListAPIView):
    """
    API endpoint to list bookings for a restaurant
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        restaurant_id = self.kwargs.get('restaurant_id')
        
        if user.role == User.ADMIN:
            # Admins can see all bookings for any restaurant
            return Booking.objects.filter(table__restaurant_id=restaurant_id)
        elif user.role == User.RESTAURANT_MANAGER:
            # Restaurant managers can only see bookings for their own restaurants
            return Booking.objects.filter(
                table__restaurant_id=restaurant_id,
                table__restaurant__manager=user
            )
        else:
            # Regular users can only see their own bookings for this restaurant
            return Booking.objects.filter(
                table__restaurant_id=restaurant_id,
                user=user
            )

class CancelBookingView(APIView):
    """
    API endpoint to cancel a booking
    """
    permission_classes = [permissions.IsAuthenticated, IsBookingOwner]
    
    def patch(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, user=request.user)
        
        if booking.status == 'cancelled':
            return Response(
                {"error": "This booking is already cancelled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking.status = 'cancelled'
        booking.save()
        
        serializer = BookingSerializer(booking)
        return Response(serializer.data)

class TodayBookingsView(generics.ListAPIView):
    """
    API endpoint to list bookings for today for restaurant managers
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        today = timezone.now().date()
        restaurant_id = self.request.query_params.get('restaurant_id')
        
        if user.role == User.ADMIN:
            # Admins can see all bookings for today, with optional restaurant filter
            queryset = Booking.objects.filter(date=today)
            if restaurant_id:
                queryset = queryset.filter(table__restaurant_id=restaurant_id)
            return queryset
        
        elif user.role == User.RESTAURANT_MANAGER:
            # Filter base query for restaurant managers
            # First get approved restaurants for this manager
            from restaurants.models import Restaurant
            approved_restaurant_ids = Restaurant.objects.filter(
                manager=user,
                approval_status='approved'
            ).values_list('id', flat=True)
            
            # Then filter bookings for those restaurants
            base_query = Booking.objects.filter(
                date=today,
                table__restaurant__manager=user,
                table__restaurant_id__in=approved_restaurant_ids
            )
            
            # If a specific restaurant ID is requested, filter by it
            if restaurant_id:
                return base_query.filter(table__restaurant_id=restaurant_id)
            return base_query
        
        else:
            # Regular customers see only their own bookings for today
            # First get list of approved restaurant IDs
            from restaurants.models import Restaurant
            approved_restaurant_ids = Restaurant.objects.filter(
                approval_status='approved'
            ).values_list('id', flat=True)
            
            # Then filter bookings for approved restaurants only
            queryset = Booking.objects.filter(
                date=today,
                user=user,
                table__restaurant_id__in=approved_restaurant_ids
            )
            if restaurant_id:
                queryset = queryset.filter(table__restaurant_id=restaurant_id)
            return queryset


class CompleteBookingView(APIView):
    """
    API endpoint to mark a booking as completed (for restaurant managers)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, pk):
        booking = get_object_or_404(Booking, id=pk)
        
        # Check if the user is the restaurant manager for this booking
        user = request.user
        if user.role != User.RESTAURANT_MANAGER or booking.table.restaurant.manager != user:
            return Response(
                {"error": "You are not authorized to mark this booking as completed."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only confirmed bookings can be marked as completed
        if booking.status != 'confirmed':
            return Response(
                {"error": f"Cannot mark booking as completed. Current status: {booking.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status to completed
        booking.status = 'completed'
        booking.save()
        
        return Response(
            {"success": "Booking has been marked as completed.",
             "booking": BookingSerializer(booking).data},
            status=status.HTTP_200_OK
        )


class NoShowBookingView(APIView):
    """
    API endpoint to mark a booking as no-show (for restaurant managers)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def patch(self, request, pk):
        booking = get_object_or_404(Booking, id=pk)
        
        # Check if the user is the restaurant manager for this booking
        user = request.user
        if user.role != User.RESTAURANT_MANAGER or booking.table.restaurant.manager != user:
            return Response(
                {"error": "You are not authorized to mark this booking as no-show."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Only confirmed bookings can be marked as no-show
        if booking.status != 'confirmed':
            return Response(
                {"error": f"Cannot mark booking as no-show. Current status: {booking.get_status_display()}."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status to no-show
        booking.status = 'no_show'
        booking.save()
        
        return Response(
            {"success": "Booking has been marked as no-show.",
             "booking": BookingSerializer(booking).data},
            status=status.HTTP_200_OK
        )


class DateRangeBookingsView(generics.ListAPIView):
    """
    API endpoint to list bookings for a date range (for restaurant managers and admins)
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Get query parameters
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        restaurant_id = self.request.query_params.get('restaurant_id')
        
        # Validate dates
        try:
            if start_date:
                start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
            else:
                # Default to today if not provided
                start_date = timezone.now().date()
                
            if end_date:
                end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
            else:
                # Default to 30 days from start_date if not provided
                end_date = start_date + timezone.timedelta(days=30)
                
        except ValueError:
            # Return empty queryset if dates are invalid
            return Booking.objects.none()
        
        # Handle different user roles
        if user.role == User.ADMIN:
            # Admins can see all bookings, with optional restaurant filter
            queryset = Booking.objects.filter(date__gte=start_date, date__lte=end_date)
            if restaurant_id:
                queryset = queryset.filter(table__restaurant_id=restaurant_id)
            return queryset
        
        elif user.role == User.RESTAURANT_MANAGER:
            # Get approved restaurants for this manager
            from restaurants.models import Restaurant
            approved_restaurant_ids = Restaurant.objects.filter(
                manager=user,
                approval_status='approved'
            ).values_list('id', flat=True)
            
            # Filter bookings by date range and manager's restaurants
            base_query = Booking.objects.filter(
                date__gte=start_date,
                date__lte=end_date,
                table__restaurant__manager=user,
                table__restaurant_id__in=approved_restaurant_ids
            )
            
            # If a specific restaurant ID is requested, filter by it
            if restaurant_id:
                return base_query.filter(table__restaurant_id=restaurant_id)
            return base_query
        
        else:
            # Regular customers can only see their own bookings
            queryset = Booking.objects.filter(
                date__gte=start_date,
                date__lte=end_date,
                user=user,
                table__restaurant__approval_status='approved'
            )
            if restaurant_id:
                queryset = queryset.filter(table__restaurant_id=restaurant_id)
            return queryset
