import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpUsername = process.env.SMTP_USERNAME || '';
const smtpPassword = process.env.SMTP_PASSWORD || '';

console.log('SMTP Username:', smtpUsername);
console.log('SMTP Password length:', smtpPassword ? smtpPassword.length : 0);

const transporter = nodemailer.createTransport({
  host: 'smtp.mailersend.net',
  port: 587,
  secure: false,
  auth: {
    user: smtpUsername,
    pass: smtpPassword
  },
  debug: true
});

export const emailService = {
  async sendEmail({ to, subject, text, html }) {
    try {
      if (!to || !subject || !text) {
        throw new Error('Missing required email parameters: to, subject, and text');
      }
      
      const verification = await transporter.verify();
      console.log('SMTP Verification:', verification);
      
      const info = await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Notification System'}" <${process.env.EMAIL_FROM || smtpUsername}>`,
        to,
        subject,
        text,
        html: html || text
      });
      
      console.log('Email sent successfully to', to);
      console.log('Message ID:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        response: info
      };
    } catch (error) {
      console.error('Email sending error:', error);
      
      if (error.response) {
        console.error('SMTP Error Response:', error.response);
      }
      
      throw error;
    }
  }
};