from django.urls import path
from .views import (
    BookingCreateView,
    UserBookingsListView,
    BookingDetailView,
    RestaurantBookingsView,
    CancelBookingView,
    TodayBookingsView,
    CompleteBookingView,
    NoShowBookingView,
    DateRangeBookingsView
)

urlpatterns = [
    path('create/', BookingCreateView.as_view(), name='booking-create'),
    path('my-bookings/', UserBookingsListView.as_view(), name='my-bookings'),
    path('<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('restaurant/<int:restaurant_id>/', RestaurantBookingsView.as_view(), name='restaurant-bookings'),
    path('cancel/<int:pk>/', CancelBookingView.as_view(), name='cancel-booking'),
    path('complete/<int:pk>/', CompleteBookingView.as_view(), name='complete-booking'),
    path('no-show/<int:pk>/', NoShowBookingView.as_view(), name='no-show-booking'),
    path('today/', TodayBookingsView.as_view(), name='today-bookings'),
    path('date-range/', DateRangeBookingsView.as_view(), name='date-range-bookings'),
]
