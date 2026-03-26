from django.urls import path
from .views import (
    BookingAnalyticsView,
    RestaurantAnalyticsView,
    SystemStatsView
)

urlpatterns = [
    path('bookings/', BookingAnalyticsView.as_view(), name='booking-analytics'),
    path('restaurant/<int:restaurant_id>/', RestaurantAnalyticsView.as_view(), name='restaurant-analytics'),
    path('system/', SystemStatsView.as_view(), name='system-stats'),
]
