from django.conf import settings
from django.utils import timezone
import logging
import time
import os
import yagmail


logger = logging.getLogger(__name__)

def send_booking_confirmation(booking):
    """
    Send confirmation email when a booking is confirmed using Yagmail
    
    Args:
        booking: The Booking object
    """
    try:
        print(f"Starting to send confirmation email for booking {booking.id} using Yagmail")
        
        # Get email credentials from environment variables
        gmail_user = os.environ.get('EMAIL_HOST_USER', 'rpooja211999@gmail.com')
        gmail_password = os.environ.get('EMAIL_HOST_PASSWORD', 'izhevhpphnebvuyf')
        
        # Create a more eye-catching subject with restaurant name
        subject = f"Your reservation at {booking.table.restaurant.name} is confirmed! - BookTableBuddy"
        
        # Format the date and time for better readability
        formatted_date = booking.date.strftime("%A, %B %d, %Y")
        
        # Create HTML version of the email for better deliverability - using inline styles
        html_message = f"""
<html>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333;">
    <table style="max-width: 600px; width: 100%; margin: 0 auto; border-collapse: collapse;">
        <tr>
            <td style="background-color: #e53935; color: white; padding: 20px; text-align: center;">
                <h1>Reservation Confirmed!</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px; background-color: #f9f9f9;">
                <p>Hello {booking.contact_name},</p>
                <p>Your reservation at <strong>{booking.table.restaurant.name}</strong> has been confirmed!</p>
                
                <div style="background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; border: 1px solid #eee;">
                    <h3>Reservation Details:</h3>
                    <p><strong>Date:</strong> {formatted_date}</p>
                    <p><strong>Time:</strong> {booking.time}</p>
                    <p><strong>Party Size:</strong> {booking.party_size} people</p>
                    <p><strong>Confirmation Code:</strong> BTB-{booking.id}</p>
                </div>
                
                <div style="background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; border: 1px solid #eee;">
                    <h3>Restaurant Location:</h3>
                    <p>{booking.table.restaurant.address}</p>
                    <p>{booking.table.restaurant.city}, {booking.table.restaurant.state} {booking.table.restaurant.zip_code}</p>
                </div>
                
                <p>If you need to cancel or modify your reservation, please log in to your BookTableBuddy account.</p>
            </td>
        </tr>
        <tr>
            <td style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px;">
                <p>Thank you for using BookTableBuddy!</p>
            </td>
        </tr>
    </table>
</body>
</html>
        """
        
        # Set recipient email
        recipient_email = booking.contact_email
        print(f"Recipient email: {recipient_email}")
        
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
            
            print("Email sent successfully using Yagmail!")
            return True
                
        except Exception as email_error:
            print(f"Error during Yagmail email sending: {str(email_error)}")
            print(f"Error type: {type(email_error).__name__}")
            raise  # Re-raise for outer exception handler
        
        return True
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
        print(f"Final error: {str(e)}")
        return False



