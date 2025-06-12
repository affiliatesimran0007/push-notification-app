// Simple Push Notification Integration
// Copy this script to your website and update the configuration

(function() {
  // Configuration - Update these values
  const PUSH_CONFIG = {
    appUrl: 'https://push-notification-app-steel.vercel.app', // Your server URL
    landingId: '1', // Your landing page ID
    vapidKey: 'BNV70f-uHInqVEOT9r2d6pVfK5WViCXdtoYjB87Nf8WUQZ6mDMSXEXGFQmJXl6bvGpvzL2jVSuPZUk-S9YS8rYc', // Get from your app settings
    
    // Optional: Custom redirect URLs
    redirects: {
      onAllow: null, // URL to redirect after user allows (null = default)
      onBlock: null  // URL to redirect after user blocks (null = default)
    }
  };

  // Initialize push notifications
  function initPushNotifications() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers are not supported');
      return;
    }

    // Bot check redirect
    const currentUrl = window.location.href;
    const botCheckUrl = `${PUSH_CONFIG.appUrl}/landing/bot-check?landingId=${PUSH_CONFIG.landingId}&redirect=${encodeURIComponent(currentUrl)}`;
    
    // Check if user has already been through bot check
    const botCheckDone = sessionStorage.getItem('push_bot_check_done');
    
    if (!botCheckDone) {
      // Redirect to bot check page
      window.location.href = botCheckUrl;
      return;
    }

    // If bot check is done, request permission immediately
    console.log('Bot check completed, requesting permission...');
    setTimeout(() => {
      requestNotificationPermission();
    }, 500); // Small delay to ensure page is ready
  }

  // Request notification permission
  function requestNotificationPermission() {
    Notification.requestPermission().then(function(permission) {
      if (permission === 'granted') {
        // Subscribe to push notifications
        subscribeToPush();
      } else if (permission === 'denied' && PUSH_CONFIG.redirects.onBlock) {
        // Redirect on block
        window.location.href = PUSH_CONFIG.redirects.onBlock;
      }
    });
  }

  // Subscribe to push notifications
  function subscribeToPush() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUSH_CONFIG.vapidKey)
      });
    }).then(function(subscription) {
      // Send subscription to server
      return fetch(`${PUSH_CONFIG.appUrl}/api/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription,
          landingId: PUSH_CONFIG.landingId,
          url: window.location.href,
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        })
      });
    }).then(function(response) {
      if (response.ok) {
        console.log('Successfully subscribed to push notifications');
        
        // Clear bot check flag
        sessionStorage.removeItem('push_bot_check_done');
        
        // Redirect on success if configured
        if (PUSH_CONFIG.redirects.onAllow) {
          window.location.href = PUSH_CONFIG.redirects.onAllow;
        }
      }
    }).catch(function(error) {
      console.error('Failed to subscribe:', error);
    });
  }

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPushNotifications);
  } else {
    initPushNotifications();
  }
})();