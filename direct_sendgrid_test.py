#!/usr/bin/env python3

import os
import sys
import json
import requests

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
    from_email = os.environ.get('SENDGRID_FROM_EMAIL', 'pooja.r.sindham@gmail.com')
    
    # Construct the SendGrid API request
    url = "https://api.sendgrid.com/v3/mail/send"
    
    # Create payload with simple email content
    payload = {
        "personalizations": [
            {
                "to": [{"email": recipient}]
            }
        ],
        "from": {"email": from_email},
        "subject": "SendGrid Direct API Test - BookTableBuddy",
        "content": [
            {
                "type": "text/html",
                "value": """<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background-color: #e53935; color: white; padding: 20px; text-align: center;'>
                        <h1>SendGrid Test Successful!</h1>
                    </div>
                    <div style='padding: 20px; background-color: #f8f8f8;'>
                        <h2>Your SendGrid integration is working!</h2>
                        <p>This email confirms that your BookTableBuddy application is correctly configured to send emails.</p>
                    </div>
                </div>"""
            }
        ]
    }
    
    # Set up headers with API key
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        print(f"Sending test email to {recipient}...")
        print("Using direct API call to SendGrid (bypassing SSL verification)")
        
        # Send request with SSL verification disabled
        response = requests.post(url, data=json.dumps(payload), headers=headers, verify=False)
        
        print(f"Status code: {response.status_code}")
        if response.text:
            print(f"Response body: {response.text}")
        
        if response.status_code >= 200 and response.status_code < 300:
            print("\nSuccess! Email sent successfully.")
            print("Please check your inbox (and spam folder) for the test email.")
            return True
        else:
            print(f"\nError: SendGrid returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

if __name__ == "__main__":
    # Disable SSL verification warnings
    from requests.packages.urllib3.exceptions import InsecureRequestWarning
    requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
    
    print("SendGrid Direct API Test - BookTableBuddy")
    print("-" * 40)
    send_test_email()
