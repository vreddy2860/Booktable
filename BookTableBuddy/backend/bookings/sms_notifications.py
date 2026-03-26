from django.conf import settings
import os
import logging
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException

logger = logging.getLogger(__name__)

def send_booking_confirmation_sms(booking):
    """
    Send a booking confirmation SMS to the customer
    
    Args:
        booking: The Booking object with contact information
    
    Returns:
        bool: True if SMS was sent successfully, False otherwise
    """
    try:
        # Get Twilio credentials from environment variables
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN') 
        from_number = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if not all([account_sid, auth_token, from_number]):
            logger.error("Twilio credentials not properly configured")
            return False
        
        # Format date for better readability
        formatted_date = booking.date.strftime("%A, %B %d, %Y")
        
        # Prepare the message text
        message_body = f"""BookTableBuddy Confirmation: 
        
        Your reservation at {booking.table.restaurant.name} is confirmed!
        
        Date: {formatted_date}
        Time: {booking.time}
        Party: {booking.party_size} people
        Confirmation #: BTB-{booking.id}
        
        Reply HELP for help or STOP to unsubscribe.
        """
        
        # Get the customer's phone number from the booking
        # Note: This assumes booking.contact_phone exists and is in E.164 format (+1XXXXXXXXXX)
        to_number = booking.contact_phone
        
        if not to_number:
            logger.error(f"No phone number available for booking {booking.id}")
            return False
            
        # Initialize Twilio client
        client = Client(account_sid, auth_token)
        
        # Send the SMS
        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=to_number
        )
        
        logger.info(f"SMS sent successfully for booking {booking.id}, SID: {message.sid}")
        return True
        
    except TwilioRestException as e:
        logger.error(f"Twilio error sending SMS for booking {booking.id}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error sending SMS for booking {booking.id}: {str(e)}")
        return False


def send_test_sms(phone_number):
    """
    Send a test SMS to verify Twilio configuration
    
    Args:
        phone_number: The phone number to send the test SMS to (in E.164 format, e.g., +1XXXXXXXXXX)
    
    Returns:
        bool: True if SMS was sent successfully, False otherwise
    """
    try:
        # Get Twilio credentials from environment variables
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN') 
        from_number = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if not all([account_sid, auth_token, from_number]):
            print("Twilio credentials not properly configured.")
            print("Please ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are set.")
            return False
        
        # Initialize Twilio client
        client = Client(account_sid, auth_token)
        
        # Test message body
        message_body = "This is a test message from BookTableBuddy. Your SMS notifications are working!"
        
        # Send the SMS
        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=phone_number
        )
        
        print(f"Test SMS sent successfully! Message SID: {message.sid}")
        return True
        
    except TwilioRestException as e:
        print(f"Twilio error: {str(e)}")
        return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False
