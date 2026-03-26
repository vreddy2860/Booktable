from django.urls import path
from .views import (
    RestaurantSearchView,
    AvailableTimeSlotsView,
    RestaurantListCreateView,
    RestaurantDetailView,
    ReviewCreateView,
    CuisineListView,
    ApproveRestaurantView,
    RestaurantsByManagerView,
    PendingApprovalRestaurantsView,
    FlexibleRestaurantSearchView,
    BulkPhotoUploadView
)
from .test_upload import test_file_upload

urlpatterns = [
    path('search/', RestaurantSearchView.as_view(), name='restaurant-search'),
    path('flexible-search/', FlexibleRestaurantSearchView.as_view(), name='flexible-restaurant-search'),
    path('available-times/<int:restaurant_id>/', AvailableTimeSlotsView.as_view(), name='available-times'),
    path('', RestaurantListCreateView.as_view(), name='restaurant-list-create'),
    path('<int:pk>/', RestaurantDetailView.as_view(), name='restaurant-detail'),
    path('<int:restaurant_id>/reviews/', ReviewCreateView.as_view(), name='review-create'),
    path('<int:restaurant_id>/photos/bulk/', BulkPhotoUploadView.as_view(), name='bulk-photo-upload'),
    path('cuisines/', CuisineListView.as_view(), name='cuisine-list'),
    path('approve/<int:pk>/', ApproveRestaurantView.as_view(), name='approve-restaurant'),
    path('my-restaurants/', RestaurantsByManagerView.as_view(), name='my-restaurants'),
    path('pending-approval/', PendingApprovalRestaurantsView.as_view(), name='pending-approval'),
]
