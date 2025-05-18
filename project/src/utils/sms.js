import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// Log environment variables status (without exposing actual values)
console.log('Twilio Environment Variables Status:');
console.log('TWILIO_ACCOUNT_SID present:', !!process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN present:', !!process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_PHONE_NUMBER present:', !!process.env.TWILIO_PHONE_NUMBER);

// Create client or placeholder if credentials are missing
let client;
try {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('Twilio credentials missing! SMS will be logged but not sent.');
    client = null;
  } else {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('Twilio client created successfully');
  }
} catch (error) {
  console.error('Error creating Twilio client:', error);
  client = null;
}

export const smsService = {
  async sendSMS({ to, message }) {
    // Validate input
    if (!to || !message) {
      console.error('SMS validation error: Missing phone number or message');
      throw new Error('Phone number and message are required');
    }
    
    console.log('Preparing to send SMS:');
    console.log('To:', to);
    console.log('Message length:', message.length);
    
    // Perform basic phone number validation/formatting
    let formattedPhone = to;
    if (!to.startsWith('+')) {
      console.warn('Phone number does not start with +, attempting to format it');
      // Basic formatting - might need adjustment for your country
      formattedPhone = '+' + to.replace(/\D/g, '');
      console.log('Formatted phone number:', formattedPhone);
    }
    
    // For development/missing credentials, just log the message
    if (!client) {
      console.log('DEVELOPMENT MODE: SMS would be sent with:');
      console.log(`To: ${formattedPhone}`);
      console.log(`Message: ${message}`);
      
      // Return mock successful response
      return {
        success: true,
        messageId: 'dev_' + Date.now(),
        status: 'dev-mode'
      };
    }
    
    try {
      console.log('Sending SMS via Twilio API...');
      
      const smsResponse = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });
      
      console.log('SMS sent successfully, SID:', smsResponse.sid);
      
      return {
        success: true,
        messageId: smsResponse.sid,
        status: smsResponse.status
      };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      
      // Provide more helpful error message based on Twilio's error code
      if (error.code) {
        console.error('Twilio error code:', error.code);
        // Handle specific Twilio error codes
        if (error.code === 21211) {
          throw new Error('Invalid phone number format');
        } else if (error.code === 21608) {
          throw new Error('Unverified phone number (trial account limitation)');
        }
      }
      
      throw error;
    }
  }
};