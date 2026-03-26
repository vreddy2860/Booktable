#!/usr/bin/env python3

import os
import sys
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# IMPORTANT: Set this environment variable to disable SSL verification
# This is needed due to the self-signed certificate issue
os.environ['PYTHONHTTPSVERIFY'] = '0'


def send_test_email():
    # Get recipient email address from command line argument
    if len(sys.argv) > 1:
        recipient = sys.argv[1]
    else:
        recipient = input("Enter recipient email address: ")
    
    # Get API key from environment variable
    api_key = os.environ.get('SENDGRID_API_KEY')
    
    if not api_key:
        print("Error: SENDGRID_API_KEY environment variable is not set.")
        print("Please make sure you've added your API key to the .env file.")
        return False
    
    # Get sender email from environment variable or use default
    from_email = os.environ.get('SENDGRID_FROM_EMAIL', 'rpooja211999@gmail.com')
    
    # Create message
    message = Mail(
        from_email=from_email,
        to_emails=recipient,
        subject='SendGrid Test - BookTableBuddy',
        html_content='''
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #e53935; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f8f8f8; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>SendGrid Test Successful!</h1>
              </div>
              <div class="content">
                <h2>Your SendGrid integration is working!</h2>
                <p>This email confirms that your BookTableBuddy application is correctly configured to send emails using SendGrid.</p>
                <p>You should now be able to receive booking confirmation emails.</p>
              </div>
            </div>
          </body>
        </html>
        '''
    )
    
    try:
        print(f"Sending test email to {recipient}...")
        print("SSL verification disabled via environment variable")
        
        # Create SendGrid client with default configuration
        sg = SendGridAPIClient(api_key)
        
        response = sg.send(message)
        
        print(f"Status code: {response.status_code}")
        print(f"Response body: {response.body}")
        print(f"Response headers: {response.headers}")
        
        if response.status_code >= 200 and response.status_code < 300:
            print("\nSuccess! Email sent successfully.")
            print("Please check your inbox (and spam folder) for the test email.")
            return True
        else:
            print(f"\nError: SendGrid returned status code {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

if __name__ == "__main__":
    print("SendGrid Test - BookTableBuddy")
    print("-" * 30)
    send_test_email()
