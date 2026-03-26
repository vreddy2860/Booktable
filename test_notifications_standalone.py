#!/usr/bin/env python3

import os
import sys
import datetime
import yagmail
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

def test_email_notification():
    print("\n" + "-" * 40)
    print("TESTING EMAIL NOTIFICATION")
    print("-" * 40)
    
    # Email settings
    gmail_user = os.environ.get('EMAIL_HOST_USER', 'rpooja211999@gmail.com')
    gmail_password = os.environ.get('EMAIL_HOST_PASSWORD', 'izhevhpphnebvuyf')
    recipient_email = input("Enter email address for testing: ")
    
    print(f"Sending test email to: {recipient_email}")
    
    # Create a more eye-catching subject
    subject = "Your reservation at Test Restaurant is confirmed! - BookTableBuddy"
    
    # Format the date for testing
    formatted_date = datetime.datetime.now().strftime("%A, %B %d, %Y")
    
    # Create HTML version of the email
    html_message = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #e53935; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #f9f9f9; }}
            .details {{ background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; border: 1px solid #eee; }}
            .footer {{ background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reservation Confirmed!</h1>
            </div>
            <div class="content">
                <p>Hello Test User,</p>
                <p>Your reservation at <strong>Test Restaurant</strong> has been confirmed!</p>
                
                <div class="details">
                    <h3>Reservation Details:</h3>
                    <p><strong>Date:</strong> {formatted_date}</p>
                    <p><strong>Time:</strong> 7:00 PM</p>
                    <p><strong>Party Size:</strong> 4 people</p>
                    <p><strong>Confirmation Code:</strong> BTB-12345</p>
                </div>
                
                <div class="details">
                    <h3>Restaurant Location:</h3>
                    <p>123 Main Street</p>
                    <p>San Francisco, CA 94105</p>
                </div>
                
                <p>If you need to cancel or modify your reservation, please log in to your BookTableBuddy account.</p>
            </div>
            <div class="footer">
                <p>Thank you for using BookTableBuddy!</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        # Initialize Yagmail SMTP
        yag = yagmail.SMTP(gmail_user, gmail_password)
        
        # Compose email content
        contents = [
            html_message  # Yagmail automatically handles HTML emails
        ]
        
        # Send the email
        print("Sending email using Yagmail...")
        yag.send(
            to=recipient_email,
            subject=subject,
            contents=contents
        )
        
        print("✅ Email notification test SUCCEEDED!")
        print("    Check your inbox for the test email")
        return True
            
    except Exception as email_error:
        print(f"❌ Error during Yagmail email sending: {str(email_error)}")
        print(f"Error type: {type(email_error).__name__}")
        return False

def test_sms_notification():
    print("\n" + "-" * 40)
    print("TESTING SMS NOTIFICATION")
    print("-" * 40)
    
    # Twilio settings
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID', '')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN', '')
    from_number = os.environ.get('TWILIO_PHONE_NUMBER', '+18446434380')
    to_number = input("Enter phone number for testing (with country code, e.g. +16692927868): ")

    if not account_sid or not auth_token:
        print("❌ Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables")
        return False
    
    print(f"Sending test SMS to: {to_number}")
    
    try:
        # Initialize Twilio client
        client = Client(account_sid, auth_token)
        
        # Create message content
        message_body = """🍽️ BookTableBuddy: Your reservation at Test Restaurant is confirmed for today at 7:00 PM. Party size: 4. Confirmation code: BTB-12345."""
        
        # Send SMS
        print("Sending SMS using Twilio...")
        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=to_number
        )
        
        print(f"Success! Message SID: {message.sid}")
        print("✅ SMS notification test SUCCEEDED!")
        print("    Check your phone for the test message")
        return True
        
    except TwilioRestException as e:
        print(f"❌ Twilio Error: {e.msg}")
        print(f"Error Code: {e.code}")
        
        if e.code == 20003:
            print("Authentication Error: Check that your Account SID and Auth Token are correct.")
        elif e.code == 21608:
            print("TIP: You need to verify the recipient's phone number in your Twilio account.")
            print("For trial accounts, each recipient number must be verified before sending.")
        elif e.code == 21211:
            print("TIP: The phone number format is invalid. Make sure it includes the country code.")
            print("Example: +14155551234 for a US number")
        return False
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def run_notification_tests():
    print("BookTableBuddy Notification Test Suite")
    print("-" * 40)
    
    # Test options
    while True:
        test_choice = input("What would you like to test? (1=Email, 2=SMS, 3=Both): ")
        if test_choice in ['1', '2', '3']:
            break
        print("Invalid choice. Please enter 1, 2, or 3.")
    
    if test_choice in ['1', '3']:
        test_email_notification()
    
    if test_choice in ['2', '3']:
        test_sms_notification()
    
    print("\n" + "-" * 40)
    print("NOTIFICATION TESTS COMPLETED")

if __name__ == "__main__":
    run_notification_tests()
