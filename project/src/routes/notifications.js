import express from 'express';
import { notificationService } from '../services/notifications.js';
import { authService } from '../services/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  try {
    const { userId, title, message, metadata, type = 'in-app', phone } = req.body;
    
    console.log('Notification request received:', { 
      userId, title, type, 
      messageLength: message ? message.length : 0,
      hasPhone: !!phone
    });
    
    if (!userId || !title || !message) {
      return res.status(400).json({ message: 'Missing stuff! Need userId, title & message' });
    }
    
    const validTypes = ['in-app', 'email', 'sms'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: `Wrong type! Use ${validTypes.join(', ')}`
      });
    }
    
    let result;
    
    if (type === 'in-app') {
      result = await notificationService.createInAppNotification({
        userId, 
        title, 
        message, 
        metadata
      });
    } else if (type === 'email') {
      try {
        const user = await authService.getUserById(userId);
        
        if (!user || !user.email) {
          return res.status(400).json({
            message: 'No email found! Check user ID!'
          });
        }
        
        result = await notificationService.sendEmailNotification({
          userId, 
          title, 
          message, 
          metadata, 
          email: user.email
        });
      } catch (error) {
        return res.status(500).json({
          message: 'Email failed!'
        });
      }
    } else if (type === 'sms') {
      try {
        // Check if phone number is provided directly in the request
        let phoneNumber = phone;
        
        // If not provided in request, try to get from user
        if (!phoneNumber) {
          console.log('No phone in request, trying to get from user');
          
          try {
            const user = await authService.getUserById(userId);
            console.log('User data:', user);
            
            if (!user) {
              return res.status(400).json({ message: 'User not found!' });
            }
            
            phoneNumber = user.phone;
            console.log('Phone from user record:', phoneNumber);
          } catch (userError) {
            console.error('Error fetching user:', userError);
            return res.status(500).json({ message: 'Error fetching user data!' });
          }
        }
        
        // Final check if we have a phone number
        if (!phoneNumber) {
          console.error('No phone number available for SMS');
          return res.status(400).json({
            message: 'Phone number required! Provide in request or add to user profile.'
          });
        }
        
        console.log('Sending SMS notification to phone:', phoneNumber);
        result = await notificationService.sendSmsNotification({
          userId, 
          title, 
          message, 
          metadata, 
          phone: phoneNumber
        });
      } catch (error) {
        console.error('SMS notification error:', error);
        return res.status(500).json({
          success: false,
          message: 'SMS failed! ' + (error.message || '')
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Sent ok!',
      data: result
    });
  } catch (error) {
    console.error('Notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Something broke! ' + (error.message || '')
    });
  }
});

router.get('/:id/notifications', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { type } = req.query;
    
    if (req.user.id !== userId) {
      return res.status(403).json({ message: 'Not your notifications!' });
    }
    
    const notifications = await notificationService.getUserNotifications(userId, type);
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get notifications!' 
    });
  }
});

router.patch('/read/:id', authenticate, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const updatedNotification = await notificationService.markAsRead(notificationId, userId);
    
    // Check if notification wasn't found
    if (updatedNotification.status === 'not_found') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found!',
        data: updatedNotification
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Marked as read',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark as read!' 
    });
  }
});

router.post('/retry-emails', authenticate, async (req, res) => {
  try {
    const results = await notificationService.retryFailedEmails();
    
    res.status(200).json({
      success: true,
      message: 'Emails retried!',
      data: results
    });
  } catch (error) {
    console.error('Retry emails error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Retry failed!' 
    });
  }
});

export default router;