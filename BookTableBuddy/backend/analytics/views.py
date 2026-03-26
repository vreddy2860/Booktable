from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Avg
from django.utils import timezone
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from django.contrib.auth import get_user_model

from bookings.models import Booking
from restaurants.models import Restaurant, Review

User = get_user_model()

class IsAdminUser(permissions.BasePermission):
    """
    Custom permission for admin users
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.ADMIN

class IsRestaurantManager(permissions.BasePermission):
    """
    Custom permission for restaurant managers
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.RESTAURANT_MANAGER

class BookingAnalyticsView(APIView):
    """
    API endpoint to get booking analytics
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        # Get last month bookings
        today = timezone.now().date()
        last_month = today - relativedelta(months=1)
        
        # Total bookings in the last month
        bookings = Booking.objects.filter(date__gte=last_month, date__lte=today)
        total_bookings = bookings.count()
        confirmed_bookings = bookings.filter(status='confirmed').count()
        cancelled_bookings = bookings.filter(status='cancelled').count()
        completed_bookings = bookings.filter(status='completed').count()
        no_show_bookings = bookings.filter(status='no_show').count()
        
        # Bookings by day of week - use a safer approach with ExtractWeekDay
        from django.db.models.functions import ExtractWeekDay
        bookings_by_day = bookings.annotate(
            day_of_week=ExtractWeekDay('date')
        ).values('day_of_week').annotate(count=Count('id'))
        
        days_map = {
            '0': 'Sunday',
            '1': 'Monday',
            '2': 'Tuesday',
            '3': 'Wednesday',
            '4': 'Thursday',
            '5': 'Friday',
            '6': 'Saturday'
        }
        
        bookings_by_day_formatted = [
            {'day': days_map.get(item['day_of_week'], item['day_of_week']), 'count': item['count']}
            for item in bookings_by_day
        ]
        
        # Top restaurants by booking count
        top_restaurants = bookings.values(
            'table__restaurant__id', 
            'table__restaurant__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Average party size
        avg_party_size = bookings.aggregate(avg=Avg('party_size'))['avg']
        
        # Daily bookings over the last month
        daily_bookings = []
        for i in range(30):
            date = today - timedelta(days=i)
            count = bookings.filter(date=date).count()
            daily_bookings.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            })
        
        data = {
            'total_bookings': total_bookings,
            'confirmed_bookings': confirmed_bookings,
            'cancelled_bookings': cancelled_bookings,
            'completed_bookings': completed_bookings,
            'no_show_bookings': no_show_bookings,
            'bookings_by_day': bookings_by_day_formatted,
            'top_restaurants': top_restaurants,
            'avg_party_size': avg_party_size,
            'daily_bookings': daily_bookings
        }
        
        return Response(data)

class RestaurantAnalyticsView(APIView):
    """
    API endpoint to get analytics for a specific restaurant
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, restaurant_id):
        user = request.user
        
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response(
                {"error": "Restaurant not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if user.role != User.ADMIN and (user.role != User.RESTAURANT_MANAGER or restaurant.manager != user):
            return Response(
                {"error": "You don't have permission to view analytics for this restaurant"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check if restaurant is approved (except for admins who can see analytics for any restaurant)
        if user.role != User.ADMIN and restaurant.approval_status != 'approved':
            return Response(
                {"error": "Analytics are only available for approved restaurants"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all bookings for lifetime total
        all_bookings = Booking.objects.filter(table__restaurant=restaurant)
        total_bookings = all_bookings.count()  # Lifetime total of all bookings
        
        # Get last month's bookings for detailed analytics
        today = timezone.now().date()
        last_month = today - relativedelta(months=1)
        
        # Last month's bookings for this restaurant
        bookings = Booking.objects.filter(
            table__restaurant=restaurant,
            date__gte=last_month,
            date__lte=today
        )
        
        # Last month's booking counts by status
        confirmed_bookings = bookings.filter(status='confirmed').count()
        cancelled_bookings = bookings.filter(status='cancelled').count()
        completed_bookings = bookings.filter(status='completed').count()
        no_show_bookings = bookings.filter(status='no_show').count()
        
        # Bookings by day of week - use a safer approach with ExtractWeekDay
        from django.db.models.functions import ExtractWeekDay
        bookings_by_day = bookings.annotate(
            day_of_week=ExtractWeekDay('date')
        ).values('day_of_week').annotate(count=Count('id'))
        
        days_map = {
            '0': 'Sunday',
            '1': 'Monday',
            '2': 'Tuesday',
            '3': 'Wednesday',
            '4': 'Thursday',
            '5': 'Friday',
            '6': 'Saturday'
        }
        
        bookings_by_day_formatted = [
            {'day': days_map.get(item['day_of_week'], item['day_of_week']), 'count': item['count']}
            for item in bookings_by_day
        ]
        
        # Average party size
        avg_party_size = bookings.aggregate(avg=Avg('party_size'))['avg']
        
        # Daily bookings over the last month
        daily_bookings = []
        for i in range(30):
            date = today - timedelta(days=i)
            count = bookings.filter(date=date).count()
            daily_bookings.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            })
        
        # Reviews analytics
        reviews = Review.objects.filter(restaurant=restaurant)
        total_reviews = reviews.count()
        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0
        
        # Get total number of tables for the restaurant
        from restaurants.models import Table
        total_tables = Table.objects.filter(restaurant=restaurant).count()
        
        # Ratings distribution
        ratings_distribution = {
            '1': reviews.filter(rating=1).count(),
            '2': reviews.filter(rating=2).count(),
            '3': reviews.filter(rating=3).count(),
            '4': reviews.filter(rating=4).count(),
            '5': reviews.filter(rating=5).count(),
        }
        
        data = {
            'restaurant_name': restaurant.name,
            'total_bookings': total_bookings,
            'confirmed_bookings': confirmed_bookings,
            'cancelled_bookings': cancelled_bookings,
            'completed_bookings': completed_bookings,
            'no_show_bookings': no_show_bookings,
            'bookings_by_day': bookings_by_day_formatted,
            'avg_party_size': avg_party_size,
            'daily_bookings': daily_bookings,
            'total_reviews': total_reviews,
            'avg_rating': avg_rating,
            'ratings_distribution': ratings_distribution,
            'total_tables': total_tables
        }
        
        return Response(data)

class SystemStatsView(APIView):
    """
    API endpoint to get system-wide statistics (admin only)
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Total counts
        total_users = User.objects.count()
        total_customers = User.objects.filter(role=User.CUSTOMER).count()
        total_managers = User.objects.filter(role=User.RESTAURANT_MANAGER).count()
        total_admins = User.objects.filter(role=User.ADMIN).count()
        
        total_restaurants = Restaurant.objects.count()
        approved_restaurants = Restaurant.objects.filter(approval_status='approved').count()
        pending_restaurants = Restaurant.objects.filter(approval_status='pending').count()
        rejected_restaurants = Restaurant.objects.filter(approval_status='rejected').count()
        
        # Booking counts by status
        total_bookings = Booking.objects.count()
        confirmed_bookings = Booking.objects.filter(status='confirmed').count()
        completed_bookings = Booking.objects.filter(status='completed').count()
        cancelled_bookings = Booking.objects.filter(status='cancelled').count()
        no_show_bookings = Booking.objects.filter(status='no_show').count()
        total_reviews = Review.objects.count()
        
        # New registrations in the last month
        today = timezone.now().date()
        last_month = today - relativedelta(months=1)
        new_users_last_month = User.objects.filter(date_joined__gte=last_month).count()
        
        # New restaurants in the last month
        new_restaurants_last_month = Restaurant.objects.filter(created_at__date__gte=last_month).count()
        
        # Bookings in the last month
        bookings_last_month = Booking.objects.filter(date__gte=last_month).count()
        
        data = {
            'users': {
                'total': total_users,
                'customers': total_customers,
                'managers': total_managers,
                'admins': total_admins,
                'new_last_month': new_users_last_month
            },
            'restaurants': {
                'total': total_restaurants,
                'approved': approved_restaurants,
                'pending': pending_restaurants,
                'rejected': rejected_restaurants,
                'new_last_month': new_restaurants_last_month
            },
            'bookings': {
                'total': total_bookings,
                'confirmed': confirmed_bookings,
                'completed': completed_bookings,
                'cancelled': cancelled_bookings,
                'no_show': no_show_bookings,
                'last_month': bookings_last_month
            },
            'reviews': {
                'total': total_reviews
            }
        }
        
        return Response(data)
