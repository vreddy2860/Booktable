#!/usr/bin/env python3

import os
import sys
import django

# Set up Django environment
sys.path.append('/Users/poojasindham/PycharmProjects/team-project-20202-teamtitans/BookTableBuddy/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BookTableBuddy.settings')
django.setup()

from bookings.models import Booking, Table
from bookings.notifications import send_booking_confirmation
from bookings.sms_notifications import send_booking_confirmation_sms

def run_notification_tests():
    print("BookTableBuddy Notification Test Suite")
    print("-" * 40)
    
    # Test options
    test_email = True
    test_sms = True
    
    # Email to use for testing
    test_email_address = input("Enter email address for testing: ")
    # Phone number for SMS testing
    test_phone_number = input("Enter phone number for testing (with country code, e.g. +16692927868): ")
    
    print("\nSetting up mock booking for testing...")
    
    try:
        # We'll create a mock booking object for testing
        # This won't be saved to the database
        mock_booking = Booking(
            id=12345, 
            contact_name="Test User",
            contact_email=test_email_address,
            contact_phone=test_phone_number,
            party_size=4,
            date="2025-06-01",
            time="19:00:00",
            special_requests="This is a test booking for notification testing."
        )
        
        # Create a mock restaurant and table for the booking
        mock_table = Table()
        mock_table.restaurant = type('Restaurant', (), {
            'name': 'Test Restaurant',
            'address': '123 Main Street',
            'city': 'San Francisco',
            'state': 'CA',
            'zip_code': '94105'
        })
        mock_booking.table = mock_table
        
        # Test email notification
        if test_email:
            print("\n" + "-" * 40)
            print("TESTING EMAIL NOTIFICATION")
            print("-" * 40)
            print(f"Sending test email to: {test_email_address}")
            
            try:
                result = send_booking_confirmation(mock_booking)
                if result:
                    print("✅ Email notification test SUCCEEDED!")
                    print("    Check your inbox for the test email")
                else:
                    print("❌ Email notification test FAILED")
            except Exception as e:
                print(f"❌ Email notification test ERROR: {str(e)}")
        
        # Test SMS notification
        if test_sms:
            print("\n" + "-" * 40)
            print("TESTING SMS NOTIFICATION")
            print("-" * 40)
            print(f"Sending test SMS to: {test_phone_number}")
            
            try:
                result = send_booking_confirmation_sms(mock_booking)
                if result:
                    print("✅ SMS notification test SUCCEEDED!")
                    print("    Check your phone for the test message")
                else:
                    print("❌ SMS notification test FAILED")
            except Exception as e:
                print(f"❌ SMS notification test ERROR: {str(e)}")
        
        print("\n" + "-" * 40)
        print("NOTIFICATION TESTS COMPLETED")
        
    except Exception as e:
        print(f"Error during test setup: {str(e)}")

if __name__ == "__main__":
    run_notification_tests()
