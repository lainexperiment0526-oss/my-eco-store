# Push Notification System - Complete Implementation Guide

## Overview

The DropLink push notification system enables mobile users (especially in Pi Browser) to receive real-time notifications about:
- New followers and social activity
- Product sales and tips
- Direct messages
- Account updates
- And more

The system supports three delivery mechanisms:
1. **Web Push API** - Browser push notifications (desktop & mobile)
2. **In-App Notifications** - Saved to database and displayed in app
3. **Pi Browser Notifications** - Native notifications in Pi Browser environment

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Application                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              React Components & UI                     │  │
│  │  - NotificationSettings.tsx (Settings Page)           │  │
│  │  - NotificationsCenter.tsx (Notification History)     │  │
│  │  - PiAuthButton.tsx (Integration Point)               │  │
│  └────────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         usePushNotifications Hook                       │  │
│  │  - Manages permission state                            │  │
│  │  - Initializes service worker                          │  │
│  │  - Syncs with Supabase in real-time                    │  │
│  │  - Exposes: requestPermission, sendTest, etc.          │  │
│  └────────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │      pushNotificationService.ts                        │  │
│  │  - Web Push subscription management                    │  │
│  │  - In-app notification display                         │  │
│  │  - Service worker registration                         │  │
│  │  - Pi Browser detection & handling                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │          Service Worker (public/sw.js)                 │  │
│  │  - Push event listener                                 │  │
│  │  - Notification click handler                          │  │
│  │  - Background sync capability                          │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           ↓                           ↓
    ┌──────────────┐          ┌──────────────────┐
    │  Browser     │          │  Web Push API    │
    │  Local       │          │  (FCM / others)  │
    │  Storage     │          │                  │
    └──────────────┘          └──────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend Server                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │      Express Routes (src/server/routes/)               │  │
│  │  - POST /api/send-push-notification                    │  │
│  │  - POST /api/subscribe-push                            │  │
│  │  - GET /api/notifications/:userId                      │  │
│  │  - PATCH /api/notifications/:id/read                   │  │
│  │  - DELETE /api/notifications/:id                       │  │
│  │  - POST /api/send-broadcast-notification               │  │
│  └────────────────────────────────────────────────────────┘  │
│                           ↓                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │    Push Notification Handlers                          │  │
│  │    (src/server/handlers/pushNotificationHandler.ts)    │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  Tables:                                                     │
│  - notifications (title, body, type, read, created_at)       │
│  - push_subscriptions (user_id, subscription_data)           │
│  - profiles (email, notification_preferences)                │
└─────────────────────────────────────────────────────────────┘
```

## Components & Modules

### 1. Frontend Components

#### `NotificationSettings.tsx`
**Location:** `src/components/NotificationSettings.tsx`
**Purpose:** User interface for managing notification preferences
**Features:**
- Browser support detection
- Pi Browser detection
- Permission status display
- Test notification button
- Notification type toggles (follows, comments, messages, sales, tips)
- Pi Browser specific guidance

**Usage:**
```tsx
import { NotificationSettings } from '@/components/NotificationSettings';

export function SettingsPage() {
  return (
    <NotificationSettings 
      profileId="user-123" 
      userEmail="user@example.com" 
    />
  );
}
```

#### `NotificationsCenter.tsx`
**Location:** `src/components/NotificationsCenter.tsx`
**Purpose:** Displays notification history
**Features:**
- Notification list with filtering (all/unread)
- Unread badge counter
- Mark as read functionality
- Notification type icons (follow, comment, like, sale, tip)
- Relative timestamps (e.g., "2 hours ago")
- Empty state handling
- Real-time updates from Supabase

**Usage:**
```tsx
import { NotificationsCenter } from '@/components/NotificationsCenter';

export function NotificationsPage() {
  return (
    <NotificationsCenter 
      profileId="user-123" 
      userEmail="user@example.com" 
    />
  );
}
```

### 2. React Hooks

#### `usePushNotifications(profileId, userEmail)`
**Location:** `src/hooks/usePushNotifications.ts`
**Purpose:** React hook for push notification management
**Returns:**
```typescript
{
  // State
  isSupported: boolean;              // Browser supports notifications
  hasPermission: boolean;            // User granted permission
  isInitialized: boolean;            // Service ready
  isLoading: boolean;                // Operation in progress
  error: string | null;              // Error message if any
  notifications: Notification[];     // List of notifications
  isPiBrowser: boolean;              // Running in Pi Browser
  
  // Methods
  requestPermission: () => Promise<boolean>;
  initialize: (profileId, email) => Promise<void>;
  sendNotification: (payload, options) => Promise<void>;
  sendTest: (profileId, email) => Promise<boolean>;
  markAsRead: (notificationId) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}
```

**Usage:**
```tsx
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function MyComponent() {
  const { 
    isSupported, 
    hasPermission, 
    notifications,
    requestPermission,
    sendTest 
  } = usePushNotifications('user-123', 'user@example.com');

  return (
    <div>
      <p>Support: {isSupported ? '✅' : '❌'}</p>
      <p>Permission: {hasPermission ? '✅' : '❌'}</p>
      <button onClick={requestPermission}>Enable Notifications</button>
      <button onClick={() => sendTest('user-123', 'user@example.com')}>
        Send Test
      </button>
    </div>
  );
}
```

### 3. Services

#### `pushNotificationService.ts`
**Location:** `src/services/pushNotificationService.ts`
**Purpose:** Low-level push notification API
**Key Methods:**

```typescript
// Permission Management
isPushNotificationSupported(): boolean
checkNotificationPermission(): NotificationPermission
requestNotificationPermission(): Promise<boolean>

// Service Worker
registerServiceWorker(): Promise<void>

// Web Push API
subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription>
unsubscribeFromPushNotifications(subscription: PushSubscription): Promise<void>

// Notifications
sendInAppNotification(payload, options): void
sendPushNotificationViaBackend(userId, payload, options): Promise<void>
sendPiBrowserNotification(payload, options): Promise<void>

// Database
saveNotificationToDatabase(profileId, payload, type): Promise<Notification>
getUserNotifications(profileId, limit?, unreadOnly?): Promise<Notification[]>
markNotificationAsRead(notificationId): Promise<void>

// Initialization
initializePushNotifications(profileId, userEmail): Promise<void>
sendTestNotification(profileId, userEmail): Promise<boolean>
```

**Usage:**
```typescript
import { pushNotificationService } from '@/services/pushNotificationService';

// Check support
if (pushNotificationService.isPushNotificationSupported()) {
  // Register service worker
  await pushNotificationService.registerServiceWorker();
  
  // Request permission
  const granted = await pushNotificationService.requestNotificationPermission();
  
  if (granted) {
    // Initialize push notifications
    await pushNotificationService.initializePushNotifications('user-123', 'user@example.com');
    
    // Send a test notification
    await pushNotificationService.sendTestNotification('user-123', 'user@example.com');
  }
}
```

### 4. Service Worker

#### `public/sw.js`
**Location:** `public/sw.js`
**Purpose:** Background notification handling
**Events Handled:**
- `push` - Receives and displays push notifications
- `notificationclick` - Handles notification clicks (navigation)
- `notificationclose` - Logs when user dismisses notification
- `fetch` - Network caching (existing functionality)

**Features:**
- Automatic notification display with vibration
- Click handlers for navigation via `redirectUrl`
- Support for notification actions
- Tag-based notification grouping
- Badge and icon support

### 5. Backend API

#### Push Notification Endpoints
**Base Route:** `/api`

**1. Send Notification to User**
```
POST /api/send-push-notification
Content-Type: application/json

{
  "userId": "user-123",
  "payload": {
    "title": "New Follower!",
    "body": "John Doe started following you",
    "icon": "https://example.com/icon.png",
    "tag": "follow",
    "redirectUrl": "/followers"
  },
  "options": {
    "isPiBrowser": false,
    "sendViaWebPush": true,
    "saveToDB": true
  }
}

Response:
{
  "success": true,
  "notificationId": "notification-uuid",
  "delivered": {
    "webPush": true,
    "database": true,
    "piBrowser": false
  },
  "message": "Notification saved to database"
}
```

**2. Store Push Subscription**
```
POST /api/subscribe-push
Content-Type: application/json

{
  "userId": "user-123",
  "subscription": {
    "endpoint": "https://...",
    "keys": { "p256dh": "...", "auth": "..." }
  }
}

Response:
{
  "success": true,
  "message": "Subscription stored"
}
```

**3. Get User Notifications**
```
GET /api/notifications/user-123?limit=50&unreadOnly=false

Response:
{
  "success": true,
  "notifications": [
    {
      "id": "notif-uuid",
      "title": "New Follower",
      "body": "John started following you",
      "type": "follow",
      "read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

**4. Mark Notification as Read**
```
PATCH /api/notifications/notif-uuid/read

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

**5. Send Broadcast Notification**
```
POST /api/send-broadcast-notification
Content-Type: application/json

{
  "userIds": ["user-1", "user-2", "user-3"],
  "payload": {
    "title": "Maintenance Update",
    "body": "System maintenance scheduled for tonight"
  }
}

Response:
{
  "success": true,
  "message": "Broadcast notification sent to 3 users",
  "recipients": 3
}
```

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  icon VARCHAR(500),
  type VARCHAR(50) DEFAULT 'general', -- follow, comment, message, sale, tip, etc
  data JSONB, -- Additional metadata (redirectUrl, etc)
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_notifications_profile_id ON notifications(profile_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### Push Subscriptions Table
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id),
  subscription_data JSONB NOT NULL, -- Web Push API subscription object
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
```

## Environment Variables

Add these to your `.env` file:

```bash
# Push Notification Configuration
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key-here

# Backend Push Configuration (if using FCM or other service)
PUSH_SERVICE_TYPE=fcm  # or 'web-push', 'pi-browser'
FCM_SERVER_KEY=your-fcm-server-key
FCM_SENDER_ID=your-fcm-sender-id

# Pi Network Configuration
VITE_PI_SANDBOX_MODE=true
VITE_PI_SANDBOX_URL=https://sandbox-api.minepi.com
```

## Integration Guide

### Step 1: Enable in Dashboard Component

Add to your dashboard or profile settings page:

```tsx
import { NotificationSettings } from '@/components/NotificationSettings';
import { NotificationsCenter } from '@/components/NotificationsCenter';
import { useUser } from '@/contexts/UserContext';

export function Dashboard() {
  const { profile, email } = useUser();

  return (
    <div className="space-y-6">
      {/* Existing dashboard content */}
      
      {/* Notification Management */}
      <NotificationSettings 
        profileId={profile.id} 
        userEmail={email} 
      />
      
      {/* Notification History */}
      <NotificationsCenter 
        profileId={profile.id} 
        userEmail={email} 
      />
    </div>
  );
}
```

### Step 2: Wire Backend Routes

Add push notification routes to your Express server:

```typescript
// src/server/index.ts
import express from 'express';
import pushNotificationRoutes from './routes/pushNotifications';

const app = express();

app.use('/api', pushNotificationRoutes);

// ... rest of your server setup
```

### Step 3: Send Notifications from Backend

When an event occurs (new follower, comment, etc.), call the endpoint:

```typescript
// Example: When a user follows another user
export async function handleNewFollow(followerId: string, userId: string) {
  // Get user details
  const user = await getUser(userId);
  const follower = await getUser(followerId);

  // Send notification
  await fetch('/api/send-push-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      payload: {
        title: `New Follower: ${follower.username}`,
        body: `${follower.username} started following your profile`,
        icon: follower.avatar_url,
        tag: 'follow',
        redirectUrl: `/profile/${follower.username}`
      },
      options: {
        saveToDB: true,
        sendViaWebPush: true,
        isPiBrowser: user.is_pi_browser
      }
    })
  });
}
```

## Testing

### Manual Testing

1. **Enable Notifications in Dashboard**
   - Navigate to settings/notifications
   - Click "Enable Notifications"
   - Grant browser permission when prompted

2. **Send Test Notification**
   - Click "Send Test Notification" button
   - Check if notification appears in notification center

3. **Test Pi Browser**
   - Open app in Pi Browser
   - Follow same steps as above
   - Notifications should appear in device notification center

### Automated Testing

```typescript
// Example test
import { usePushNotifications } from '@/hooks/usePushNotifications';

describe('Push Notifications', () => {
  it('should request permission and initialize', async () => {
    const { requestPermission, initialize } = usePushNotifications('user-123', 'user@example.com');
    
    const granted = await requestPermission();
    expect(granted).toBe(true);
    
    await initialize('user-123', 'user@example.com');
    // Verify service worker registered
  });

  it('should send test notification', async () => {
    const { sendTest } = usePushNotifications('user-123', 'user@example.com');
    
    const success = await sendTest('user-123', 'user@example.com');
    expect(success).toBe(true);
  });
});
```

## Troubleshooting

### Issue: "Push notifications not supported"
- **Cause:** Browser doesn't support Notification API or Service Workers
- **Solution:** 
  - Use a modern browser (Chrome, Firefox, Edge, Safari 16+)
  - Enable Service Workers (usually default)
  - Check HTTPS is enabled (required for Service Workers)

### Issue: "Notification permission denied"
- **Cause:** User blocked notifications
- **Solution:**
  - Check browser settings for notification permissions
  - Clear site data and try again
  - Use incognito/private browsing to reset

### Issue: "No subscriptions found" in server logs
- **Cause:** Service Worker not registered or subscription failed
- **Solution:**
  - Verify service worker file exists at `/public/sw.js`
  - Check VAPID keys are correctly configured
  - Ensure HTTPS is enabled

### Issue: Notifications not appearing in Pi Browser
- **Cause:** Pi Browser notification API differs from standard
- **Solution:**
  - Verify `isPiBrowser` detection is working
  - Check Pi Browser SDK version
  - Test with Pi Browser notifications API directly

## Best Practices

1. **Permission Handling**
   - Request permission at optimal time (not on page load)
   - Show clear explanation of why notifications are needed
   - Respect user's decision if they deny

2. **Notification Content**
   - Keep titles under 50 characters
   - Keep body under 200 characters
   - Use consistent icons and branding
   - Include action URLs for engagement

3. **Frequency**
   - Don't send too many notifications (user burnout)
   - Allow users to control notification types
   - Batch related notifications
   - Respect quiet hours

4. **Testing**
   - Always test on actual devices
   - Test with network issues (offline mode)
   - Test on multiple browsers
   - Monitor error logs for issues

## Future Enhancements

- [ ] Firebase Cloud Messaging (FCM) integration for better Web Push
- [ ] Notification scheduling (send at optimal time)
- [ ] Advanced analytics (click rates, delivery tracking)
- [ ] Notification templates with variables
- [ ] Notification personalization based on user preferences
- [ ] Smart notification grouping and summarization
- [ ] Voice notifications for accessible experience
- [ ] Notification actions (reply, approve, delete directly from notification)

## Support

For issues or questions about the push notification system:
1. Check the troubleshooting section above
2. Review service worker logs (DevTools → Application → Service Workers)
3. Check browser console for errors
4. Verify database schema is up to date
5. Ensure all environment variables are set

## References

- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Protocol](https://tools.ietf.org/html/draft-thomson-webpush-protocol)
- [Pi Browser Documentation](https://developers.minepi.com/)
