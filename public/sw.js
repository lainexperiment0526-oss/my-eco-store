// Service Worker for Droplink
// Handles push notifications and background sync

// ============================================
// Push Notification Handling
// ============================================

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  if (!event.data) {
    console.log('[SW] Push event with no data');
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/badge-72.png',
      tag: data.tag || 'default-notification',
      requireInteraction: data.requireInteraction || false,
      vibrate: data.vibrate || [200, 100, 200],
      data: {
        ...data.data,
        dateOfArrival: Date.now(),
        redirectUrl: data.redirectUrl,
      },
      actions: data.actions || [],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'DropLink', options)
    );
  } catch (error) {
    console.error('[SW] Error handling push notification:', error);
  }
});

// Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Get the redirect URL from notification data
  const redirectUrl = event.notification.data?.redirectUrl || '/';
  
  // Handle action clicks
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
  }
  
  // Focus or open the app and navigate to the redirect URL
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === '/' || client.url === redirectUrl || client.focused) {
          client.focus();
          client.navigate(redirectUrl);
          return;
        }
      }
      
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(redirectUrl);
      }
    })
  );
});

// Listen for notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// ============================================
// Fetch and Network Handling
// ============================================

self.addEventListener('fetch', event => {
  // Ignore chrome-extension requests to prevent "unsupported scheme" errors
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Only handle requests to same-origin or allowlist
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin && url.hostname !== 'sdk.minepi.com') {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => new Response(''))
  );
});

// ============================================
// Service Worker Lifecycle
// ============================================

// Listen for service worker install
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

// Listen for service worker activate
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(clients.claim());
});
