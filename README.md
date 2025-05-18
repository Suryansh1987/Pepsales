# Notification API Service Pepsales

A robust notification system that supports in-app, email, and SMS notifications.

## Features

- ✉️ Multiple notification types (in-app, email, SMS)
- 🔔 User-specific notifications
- 📱 SMS integration via Twilio
- 📧 Email sending capabilities
- 📋 Notification status tracking
- 🔄 Retry mechanism for failed emails

⚠️ **PLEASE READ BEFORE TESTING** ⚠️

This notification system is set up with trial accounts for testing purposes only. To ensure successful testing:

- **Email Testing**: Use ONLY the following email address for testing email notifications:
  ```
  suryansh.singh.5806@gmail.com
  ```

- **SMS Testing**: Use ONLY the following phone number for testing SMS notifications:
  ```
  +918423280190
  ```

These are the only email address and phone number verified on our trial accounts. Using any other contact information will result in failed notifications.


## API Endpoints

### Send a Notification
- **Endpoint:** `POST /notifications`
- **Auth Required:** Yes
- **Description:** Creates and sends a notification to a user

#### Request Body
```json
{
  "userId": 1,
  "title": "Notification Title",
  "message": "This is the notification message",
  "type": "in-app",
  "metadata": {
    "category": "test",
    "priority": "high"
  },
  "phone": "+1234567890" // Optional, for SMS notifications
}
```

#### Available Notification Types
- `in-app` - Stored in database for retrieval in the app
- `email` - Sent via email to the user's email address
- `sms` - Sent via SMS to the user's phone number

### Get User Notifications
- **Endpoint:** `GET /users/:id/notifications`
- **Auth Required:** Yes
- **Description:** Retrieves notifications for a specific user
- **URL Params:** `id` - The user ID
- **Query Params:** `type` - Filter by notification type (optional)

### Mark Notification as Read
- **Endpoint:** `PATCH /notifications/:id/read`
- **Auth Required:** Yes
- **Description:** Marks a notification as read
- **URL Params:** `id` - The notification ID



## Testing the API

### Postman Collection Structure

```
Notification API/
├── Auth/
│   ├── Register            # Create a new user account
│   └── Login               # Authenticate and get JWT token
└── Notifications/
    ├── Create In-App Notification  # Send an in-app notification
    ├── Create Email Notification   # Send an email notification  
    ├── Create SMS Notification     # Send an SMS notification
    ├── Get User Notifications      # Retrieve user's notifications
    └── Mark as Read               # Mark notification as read
```

For easy testing, you can use our Postman collection:

https://www.postman.com/pepsales-7521/workspace/pepsales/collection/39544043-1852aa88-af33-4cb9-be50-456b7b4dc65f?action=share&creator=39544043

Alternatively import the  JSON into Postman named as test.json

