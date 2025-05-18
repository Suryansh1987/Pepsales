import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();


console.log('Twilio Environment Variables Status:');
console.log('TWILIO_ACCOUNT_SID present:', !!process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN present:', !!process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_PHONE_NUMBER present:', !!process.env.TWILIO_PHONE_NUMBER);


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
  
    if (!to || !message) {
      console.error('SMS validation error: Missing phone number or message');
      throw new Error('Phone number and message are required');
    }
    
    console.log('Preparing to send SMS:');
    console.log('To:', to);
    console.log('Message length:', message.length);
    
   
    let formattedPhone = to;
    if (!to.startsWith('+')) {
      console.warn('Phone number does not start with +, attempting to format it');
      
      formattedPhone = '+' + to.replace(/\D/g, '');
      console.log('Formatted phone number:', formattedPhone);
    }
    
    
    if (!client) {
      console.log('DEVELOPMENT MODE: SMS would be sent with:');
      console.log(`To: ${formattedPhone}`);
      console.log(`Message: ${message}`);
      
      
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
      
      
      if (error.code) {
        console.error('Twilio error code:', error.code);
       
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