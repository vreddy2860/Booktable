from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_restaurant_name', 'user', 'date', 'time', 'party_size', 'status')
    list_filter = ('status', 'date')
    search_fields = ('user__username', 'table__restaurant__name', 'contact_name', 'contact_email')
    date_hierarchy = 'date'
    
    def get_restaurant_name(self, obj):
        return obj.table.restaurant.name
    get_restaurant_name.short_description = 'Restaurant'

