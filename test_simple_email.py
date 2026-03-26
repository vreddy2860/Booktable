#!/usr/bin/env python3

import yagmail

def send_simple_html_email():
    # Email settings
    gmail_user = 'rpooja211999@gmail.com'
    gmail_password = 'izhevhpphnebvuyf'
    recipient_email = 'pooja.r.sindham@gmail.com'
    
    print(f"Sending test email to: {recipient_email}")
    
    # Create a simpler HTML email with fewer CSS rules
    subject = "BookTableBuddy - Simple HTML Email Test"
    
    # Very simple HTML email with minimal inline styling
    html_content = """
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #e53935; color: white; padding: 20px; text-align: center;">
            <h1>Reservation Confirmed!</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Hello Test User,</p>
            <p>Your reservation at <strong>Test Restaurant</strong> has been confirmed!</p>
            
            <div style="background-color: white; padding: 15px; margin: 15px 0; border: 1px solid #eee;">
                <h3>Reservation Details:</h3>
                <p><strong>Date:</strong> Thursday, May 8, 2025</p>
                <p><strong>Time:</strong> 7:00 PM</p>
                <p><strong>Party Size:</strong> 4 people</p>
                <p><strong>Confirmation Code:</strong> BTB-12345</p>
            </div>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px;">
            <p>Thank you for using BookTableBuddy!</p>
        </div>
    </body>
    </html>
    """
    
    try:
        # Initialize Yagmail
        yag = yagmail.SMTP(gmail_user, gmail_password)
        
        # Send email with HTML content
        yag.send(
            to=recipient_email,
            subject=subject,
            contents=html_content
        )
        
        print("✅ Simple HTML email sent successfully!")
        return True
    except Exception as e:
        print(f"❌ Error sending email: {str(e)}")
        return False

if __name__ == "__main__":
    send_simple_html_email()
