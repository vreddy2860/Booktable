from django.contrib import admin
from django.utils.html import format_html
from .models import Restaurant, Cuisine, RestaurantHours, Table, Review, RestaurantPhoto
from .forms import RestaurantPhotoForm

# Register restaurant models
@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'approval_status', 'manager')
    list_filter = ('approval_status', 'cuisine', 'city')
    search_fields = ('name', 'city', 'state')

@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(RestaurantHours)
class RestaurantHoursAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'day', 'opening_time', 'closing_time')
    list_filter = ('day',)

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'table_number', 'capacity')

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'user', 'rating', 'created_at')
    list_filter = ('rating',)

@admin.register(RestaurantPhoto)
class RestaurantPhotoAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'caption', 'is_primary', 'image_preview')
    list_filter = ('is_primary', 'restaurant')
    form = RestaurantPhotoForm
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        # Display a thumbnail in the admin
        if obj.image:
            return format_html('<img src="{0}" height="50" />', obj.image.url)
        return 'No Image'
    
    image_preview.short_description = 'Preview'
    
    def save_model(self, request, obj, form, change):
        # Debug print to see what's being passed in the form
        print(f'Saving RestaurantPhoto with image: {obj.image}')
        if obj.image:
            print(f'Image name: {obj.image.name}')
            print(f'Image size: {obj.image.size if hasattr(obj.image, "size") else "No size available"}')
            print(f'Image path: {obj.image.path if hasattr(obj.image, "path") else "No path available"}')
        
        # Call the standard save method
        super().save_model(request, obj, form, change)
