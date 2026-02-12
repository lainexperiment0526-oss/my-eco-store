/**
 * Push Notification Service for Pi Browser and Web
 * Handles browser push notifications, in-app notifications, and Pi Browser specific features
 */

import { supabase } from "@/integrations/supabase/client";

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  timestamp?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
}

export interface PushNotificationOptions {
  requireInteraction?: boolean;
  vibrate?: number[];
  sound?: string;
  redirectUrl?: string;
  tag?: string;
  badge?: string;
  icon?: string;
}

/**
 * Check if browser supports push notifications
 */
export const isPushNotificationSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Notification API support
  const hasNotificationAPI = 'Notification' in window;
  
  // Check for Service Worker support
  const hasServiceWorker = 'serviceWorker' in navigator;
  
  return hasNotificationAPI && hasServiceWorker;
};

/**
 * Check if user has granted notification permission
 */
export const checkNotificationPermission = (): NotificationPermission => {
  if (typeof window === 'undefined') return 'denied';
  if (!('Notification' in window)) return 'denied';
  
  return Notification.permission;
};

/**
 * Request permission from user for push notifications
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isPushNotificationSupported()) {
    console.warn('[PUSH] Notifications not supported');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    console.log(`[PUSH] Notification permission: ${permission}`);
    return granted;
  } catch (error) {
    console.error('[PUSH] Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Register service worker for push notifications
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[PUSH] Service Workers not supported');
    return null;
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('[PUSH] Service Worker registered');
    return registration;
  } catch (error) {
    console.error('[PUSH] Service Worker registration failed:', error);
    return null;
  }
};

/**
 * Subscribe to web push notifications
 */
export const subscribeToPushNotifications = async (
  vapidPublicKey: string
): Promise<PushSubscription | null> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.pushManager) {
      console.warn('[PUSH] Push Manager not available');
      return null;
    }
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey,
    });
    
    console.log('[PUSH] Subscribed to push notifications');
    return subscription;
  } catch (error) {
    console.error('[PUSH] Failed to subscribe to push notifications:', error);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('[PUSH] No active subscription');
      return true;
    }
    
    await subscription.unsubscribe();
    console.log('[PUSH] Unsubscribed from push notifications');
    return true;
  } catch (error) {
    console.error('[PUSH] Error unsubscribing from push notifications:', error);
    return false;
  }
};

/**
 * Send in-app notification
 */
export const sendInAppNotification = (
  payload: NotificationPayload,
  options: PushNotificationOptions = {}
): Notification | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (!isPushNotificationSupported()) {
    console.warn('[PUSH] Push notifications not supported');
    return null;
  }
  
  if (checkNotificationPermission() !== 'granted') {
    console.warn('[PUSH] Notification permission not granted');
    return null;
  }
  
  try {
    const notificationOptions: NotificationOptions & { vibrate?: number[] } = {
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/badge-72.png',
      tag: payload.tag || 'default',
      requireInteraction: options.requireInteraction ?? false,
      data: {
        ...payload.data,
        timestamp: payload.timestamp || Date.now(),
        redirectUrl: options.redirectUrl,
      },
    };
    
    // Add vibrate if supported
    if (options.vibrate) {
      (notificationOptions as any).vibrate = options.vibrate;
    } else {
      (notificationOptions as any).vibrate = [200, 100, 200];
    }
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const notification = new Notification(payload.title, notificationOptions);
      
      // Handle click
      notification.onclick = () => {
        if (options.redirectUrl) {
          window.location.href = options.redirectUrl;
        }
        notification.close();
      };
      
      console.log('[PUSH] In-app notification sent:', payload.title);
      return notification;
    }
  } catch (error) {
    console.error('[PUSH] Failed to send in-app notification:', error);
  }
  
  return null;
};

/**
 * Send push notification via backend
 */
export const sendPushNotificationViaBackend = async (
  userId: string,
  payload: NotificationPayload,
  options: PushNotificationOptions = {}
): Promise<boolean> => {
  try {
    const response = await fetch('/api/send-push-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        payload,
        options: {
          saveToDatabase: true,
          sendViaWebPush: true,
        },
      }),
    });
    
    if (!response.ok) {
      console.error('[PUSH] Backend request failed:', response.statusText);
      return false;
    }
    
    console.log('[PUSH] Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('[PUSH] Failed to send push notification:', error);
    return false;
  }
};

/**
 * Save notification to database
 */
export const saveNotificationToDatabase = async (
  profileId: string,
  payload: NotificationPayload,
  type: string
): Promise<boolean> => {
  try {
    // TODO: Uncomment once notifications table exists in Supabase
    /*
    const { error } = await supabase.from('notifications').insert([
      {
        profile_id: profileId,
        type,
        title: payload.title,
        message: payload.body,
        data: payload.data,
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);
    
    if (error) {
      console.error('[PUSH] Failed to save notification to database:', error);
      return false;
    }
    
    console.log('[PUSH] Notification saved to database');
    return true;
    */
    console.log('[PUSH] Notification would be saved to database:', { profileId, type, title: payload.title });
    return true;
  } catch (error) {
    console.error('[PUSH] Error saving notification:', error);
    return false;
  }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (
  profileId: string,
  limit = 20,
  unreadOnly = false
): Promise<any[]> => {
  try {
    // TODO: Uncomment once notifications table exists in Supabase
    /*
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[PUSH] Failed to fetch notifications:', error);
      return [];
    }
    
    return data || [];
    */
    console.log(`[PUSH] Fetching ${unreadOnly ? 'unread ' : ''}notifications for profile ${profileId} (limit: ${limit})`);
    return [];
  } catch (error) {
    console.error('[PUSH] Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    // TODO: Uncomment once notifications table exists in Supabase
    /*
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (error) {
      console.error('[PUSH] Failed to mark notification as read:', error);
      return false;
    }
    
    return true;
    */
    console.log(`[PUSH] Marking notification ${notificationId} as read`);
    return true;
  } catch (error) {
    console.error('[PUSH] Error marking notification as read:', error);
    return false;
  }
};

/**
 * Initialize push notifications for a user
 */
export const initializePushNotifications = async (
  profileId: string,
  userEmail: string
): Promise<void> => {
  // Check if notifications are supported
  if (!isPushNotificationSupported()) {
    console.log('[PUSH] Push notifications not supported on this device');
    return;
  }
  
  console.log('[PUSH] Initializing push notifications...');
  
  // Request permission
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('[PUSH] User denied notification permission');
    return;
  }
  
  // Register service worker
  await registerServiceWorker();
  
  // For web push, subscribe to push notifications
  try {
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    if (vapidPublicKey) {
      const subscription = await subscribeToPushNotifications(vapidPublicKey);
      
      if (subscription) {
        console.log('[PUSH] Web Push subscription ready (persistence pending DB schema)');
      }
    }
  } catch (error) {
    console.error('[PUSH] Error subscribing to push notifications:', error);
  }
  
  console.log('[PUSH] Push notifications initialized');
};

/**
 * Send notification to Pi Browser user
 */
export const sendPiBrowserNotification = async (
  payload: NotificationPayload,
  options: PushNotificationOptions = {}
): Promise<boolean> => {
  try {
    // Try web notification API first (works in Pi Browser web)
    if (isPushNotificationSupported() && checkNotificationPermission() === 'granted') {
      sendInAppNotification(payload, options);
      return true;
    }
    
    // Fallback: Log that user needs to check their notification center
    console.log('[PUSH] Pi Browser notification:', {
      title: payload.title,
      body: payload.body,
      timestamp: Date.now(),
    });
    
    return true;
  } catch (error) {
    console.error('[PUSH] Error sending Pi Browser notification:', error);
    return false;
  }
};

/**
 * Send a test notification
 */
export const sendTestNotification = async (
  profileId: string,
  userEmail: string
): Promise<boolean> => {
  const testPayload: NotificationPayload = {
    title: '🎉 DropLink Notification Test',
    body: 'If you see this, push notifications are working!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      type: 'test',
      timestamp: Date.now(),
    },
  };
  
  // Save to database
  await saveNotificationToDatabase(profileId, testPayload, 'test');
  
  // Send in-app notification if permission is granted
  if (checkNotificationPermission() === 'granted') {
    sendInAppNotification(testPayload, {
      redirectUrl: '/notifications',
    });
    return true;
  }
  
  // Try to send via backend
  return await sendPushNotificationViaBackend(profileId, testPayload, {
    redirectUrl: '/notifications',
  });
};
