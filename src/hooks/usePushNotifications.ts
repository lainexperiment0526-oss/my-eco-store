import { useEffect, useState, useCallback, useRef } from 'react';
import {
  isPushNotificationSupported,
  checkNotificationPermission,
  requestNotificationPermission,
  initializePushNotifications,
  sendInAppNotification,
  sendTestNotification,
  NotificationPayload,
  PushNotificationOptions,
  getUserNotifications,
  markNotificationAsRead,
} from '../services/pushNotificationService';
import { isPiBrowserEnv } from '@/contexts/PiContext';
import { supabase } from '@/integrations/supabase/client';

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  hasPermission: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  notifications: any[];
  isPiBrowser: boolean;
  
  // Methods
  requestPermission: () => Promise<boolean>;
  initialize: (profileId: string, userEmail: string) => Promise<void>;
  sendNotification: (payload: NotificationPayload, options?: PushNotificationOptions) => void;
  sendTest: (profileId: string, userEmail: string) => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  refreshNotifications: (profileId: string) => Promise<void>;
}

export const usePushNotifications = (
  profileId: string | null,
  userEmail: string | null
): UsePushNotificationsReturn => {
  const [isSupported] = useState(() => isPushNotificationSupported());
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isPiBrowser] = useState(() => isPiBrowserEnv());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Check current permission
  useEffect(() => {
    const permission = checkNotificationPermission();
    setHasPermission(permission === 'granted');
  }, []);

  // Play a short tone for new follow notifications
  const playFollowSound = useCallback(() => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.value = 880; // Pleasant alert tone
      gain.gain.value = 0.08; // Keep volume low

      osc.connect(gain).connect(ctx.destination);

      const now = ctx.currentTime;
      osc.start(now);
      osc.stop(now + 0.18);
      gain.gain.setTargetAtTime(0.0001, now + 0.12, 0.08);
    } catch (err) {
      console.warn('[Hook] Follow sound failed:', err);
    }
  }, []);

  // Request permission
  const requestPermissionHandler = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const granted = await requestNotificationPermission();
      setHasPermission(granted);
      return granted;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMsg);
      console.error('[Hook] Error requesting permission:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize push notifications
  const initializeHandler = useCallback(async (pId: string, email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await initializePushNotifications(pId, email);
      setIsInitialized(true);
      console.log('[Hook] Push notifications initialized');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize';
      setError(errorMsg);
      console.error('[Hook] Error initializing push notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-initialize if profile and email are available
  useEffect(() => {
    if (profileId && userEmail && isSupported && hasPermission && !isInitialized) {
      initializeHandler(profileId, userEmail);
    }
  }, [profileId, userEmail, isSupported, hasPermission, isInitialized, initializeHandler]);

  // Send notification
  const sendNotificationHandler = useCallback(
    (payload: NotificationPayload, options?: PushNotificationOptions) => {
      if (!isSupported) {
        setError('Push notifications not supported');
        return;
      }

      if (!hasPermission) {
        setError('Notification permission not granted');
        return;
      }

      try {
        sendInAppNotification(payload, options);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send notification';
        setError(errorMsg);
        console.error('[Hook] Error sending notification:', err);
      }
    },
    [isSupported, hasPermission]
  );

  // Send test notification
  const sendTestHandler = useCallback(async (pId: string, email: string) => {
    if (!isSupported) {
      setError('Push notifications not supported');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      const success = await sendTestNotification(pId, email);
      return success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send test notification';
      setError(errorMsg);
      console.error('[Hook] Error sending test notification:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Mark notification as read
  const markAsReadHandler = useCallback(async (notificationId: string) => {
    try {
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
      }
      return success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to mark as read';
      setError(errorMsg);
      console.error('[Hook] Error marking as read:', err);
      return false;
    }
  }, []);

  // Refresh notifications from database
  const refreshNotificationsHandler = useCallback(async (pId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserNotifications(pId, 50);
      setNotifications(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMsg);
      console.error('[Hook] Error refreshing notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch notifications when profile changes
  useEffect(() => {
    if (profileId) {
      refreshNotificationsHandler(profileId);

      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel(`notifications:${profileId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `profile_id=eq.${profileId}`,
          },
          (payload) => {
            console.log('[Hook] Real-time notification update:', payload);
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new, ...prev]);
              if ((payload.new as any)?.type === 'follow') {
                playFollowSound();
              }
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev =>
                prev.map(n => n.id === payload.new.id ? payload.new : n)
              );
            }
          }
        )
        .subscribe();

      return () => {
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => undefined);
        }
        supabase.removeChannel(channel);
      };
    }
  }, [playFollowSound, profileId, refreshNotificationsHandler]);

  return {
    isSupported,
    hasPermission,
    isInitialized,
    isLoading,
    error,
    notifications,
    isPiBrowser,
    requestPermission: requestPermissionHandler,
    initialize: initializeHandler,
    sendNotification: sendNotificationHandler,
    sendTest: sendTestHandler,
    markAsRead: markAsReadHandler,
    refreshNotifications: refreshNotificationsHandler,
  };
};
