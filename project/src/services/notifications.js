import db from '../db/index.js';
import { notifications, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { emailService } from '../utils/email.js';
import { smsService } from '../utils/sms.js';

export const notificationService = {
  async createInAppNotification(data) {
    const newNotification = await db.insert(notifications)
      .values({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: 'in-app',
        metadata: data.metadata
      })
      .returning();
    
    return {
      id: newNotification[0].id,
      type: 'in-app',
      status: 'sent'
    };
  },
  
  async sendEmailNotification(data) {
    if (!data.email) {
      throw new Error('No email');
    }

    const newNotification = await db.insert(notifications)
      .values({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: 'email',
        metadata: data.metadata
      })
      .returning();
    
    try {
      await emailService.sendEmail({
        to: data.email,
        subject: data.title,
        text: data.message,
        html: `<h1>${data.title}</h1><p>${data.message}</p>`
      });
      
      await db.update(notifications)
        .set({ 
          isEmailed: true,
          emailStatus: 'sent'
        })
        .where(eq(notifications.id, newNotification[0].id));
      
      return { 
        id: newNotification[0].id,
        type: 'email',
        status: 'sent'
      };
    } catch (emailError) {
      await db.update(notifications)
        .set({ 
          isEmailed: false,
          emailStatus: 'failed',
          retryCount: 1
        })
        .where(eq(notifications.id, newNotification[0].id));
      
      return { 
        id: newNotification[0].id,
        type: 'email',
        status: 'failed'
      };
    }
  },
  
 // Updated sendSmsNotification function with better error handling and logging
async sendSmsNotification(data) {
  console.log('sendSmsNotification called with data:', {
    userId: data.userId,
    title: data.title,
    phone: data.phone // Log the phone to verify it's being passed correctly
  });
  
  // More robust phone validation
  if (!data.phone || data.phone.trim() === '') {
    console.error('Phone number missing or empty in sendSmsNotification');
    throw new Error('Phone number is required for SMS notifications');
  }
  
  // Validate phone number format (basic E.164 check)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(data.phone)) {
    console.warn('Phone number may not be in E.164 format:', data.phone);
    // Continue anyway as some phone systems accept other formats
  }

  console.log('Creating SMS notification record in database');
  const newNotification = await db.insert(notifications)
    .values({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: 'sms',
      metadata: {
        ...data.metadata,
        phoneNumber: data.phone // Store the phone number in metadata for reference
      }
    })
    .returning();
  
  console.log('SMS notification record created:', newNotification[0].id);
  
  try {
    console.log(`Attempting to send SMS to ${data.phone}`);
    
    const smsResult = await smsService.sendSMS({
      to: data.phone,
      message: data.message
    });
    
    console.log('SMS sent successfully, result:', smsResult);
    
    await db.update(notifications)
      .set({ 
        status: 'sent',
        metadata: {
          ...data.metadata,
          smsStatus: 'sent',
          twilioMessageId: smsResult.messageId || null
        }
      })
      .where(eq(notifications.id, newNotification[0].id));
    
    return { 
      id: newNotification[0].id,
      type: 'sms',
      status: 'sent'
    };
  } catch (smsError) {
    console.error('SMS sending failed:', smsError);
    
    // Log more details about the error
    if (smsError.response) {
      console.error('SMS Error Response:', smsError.response);
    }
    
    await db.update(notifications)
      .set({ 
        status: 'failed',
        metadata: {
          ...data.metadata,
          smsStatus: 'failed',
          error: smsError.message
        }
      })
      .where(eq(notifications.id, newNotification[0].id));
    
    return { 
      id: newNotification[0].id,
      type: 'sms',
      status: 'failed',
      error: smsError.message
    };
  }
},
  
  async getUserNotifications(userId, type) {
    let query = db.select({
      id: notifications.id,
      title: notifications.title,
      type: notifications.type,
      status: notifications.status
    })
    .from(notifications)
    .where(eq(notifications.userId, userId));
    
    if (type) {
      query = query.where(eq(notifications.type, type));
    }
    
    return await query.orderBy(notifications.createdAt);
  },
  
  async markAsRead(notificationId, userId) {
    // First check if the notification exists and belongs to the user
    const existingNotification = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .limit(1);
    
    if (existingNotification.length === 0) {
      // Return a default response instead of throwing error
      return {
        id: notificationId,
        status: 'not_found',
        message: 'Notification not found or does not belong to user'
      };
    }
    
    // Update the notification status
    const updatedNotification = await db.update(notifications)
      .set({ status: 'read' })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
    
    return {
      id: updatedNotification[0].id,
      status: 'read'
    };
  },
  
  async retryFailedEmails() {
    const failedEmails = await db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.type, 'email'),
          eq(notifications.emailStatus, 'failed'),
          eq(notifications.retryCount, 1)
        )
      )
      .limit(10);
    
    const results = {
      success: 0,
      failed: 0
    };
    
    for (const notification of failedEmails) {
      try {
        const user = await db.select({ email: users.email })
          .from(users)
          .where(eq(users.id, notification.userId))
          .limit(1);
        
        if (user.length === 0 || !user[0].email) {
          await db.update(notifications)
            .set({ retryCount: notification.retryCount + 1 })
            .where(eq(notifications.id, notification.id));
          
          results.failed++;
          continue;
        }
        
        await emailService.sendEmail({
          to: user[0].email,
          subject: notification.title,
          text: notification.message,
          html: `<h1>${notification.title}</h1><p>${notification.message}</p>`
        });
        
        await db.update(notifications)
          .set({ 
            isEmailed: true,
            emailStatus: 'sent',
            retryCount: notification.retryCount + 1
          })
          .where(eq(notifications.id, notification.id));
        
        results.success++;
      } catch (error) {
        await db.update(notifications)
          .set({ retryCount: notification.retryCount + 1 })
          .where(eq(notifications.id, notification.id));
        
        results.failed++;
      }
    }
    
    return results;
  }
};