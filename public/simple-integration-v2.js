// Simple Push Notification Integration V2
// This version properly handles the bot check flow

(function() {
  // Get configuration from inline script or use defaults
  const PUSH_CONFIG = window.PUSH_CONFIG || {
    appUrl: 'https://push-notification-app-steel.vercel.app',
    landingId: '1',
    vapidKey: 'BNV70f-uHInqVEOT9r2d6pVfK5WViCXdtoYjB87Nf8WUQZ6mDMSXEXGFQmJXl6bvGpvzL2jVSuPZUk-S9YS8rYc',
    redirects: {
      onAllow: null,
      onBlock: null
    }
  };

  // Initialize push notifications
  function initPushNotifications() {
    console.log('[Push Integration] Initializing...');
    
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('[Push Integration] Browser does not support notifications');
      return;
    }

    // Check current permission status
    const currentPermission = Notification.permission;
    console.log('[Push Integration] Current permission:', currentPermission);

    // Check if we're coming back from bot check
    const urlParams = new URLSearchParams(window.location.search);
    const fromBotCheck = urlParams.get('from_bot_check') === 'true';
    const permissionResult = urlParams.get('permission');
    
    if (fromBotCheck) {
      console.log('[Push Integration] Returned from bot check with permission:', permissionResult);
      
      // Clean up URL
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Handle redirect based on permission result
      if (permissionResult === 'granted' && PUSH_CONFIG.redirects.onAllow) {
        window.location.href = PUSH_CONFIG.redirects.onAllow;
      } else if (permissionResult === 'denied' && PUSH_CONFIG.redirects.onBlock) {
        window.location.href = PUSH_CONFIG.redirects.onBlock;
      }
      
      return;
    }

    // Check if already subscribed or denied
    if (currentPermission === 'granted') {
      console.log('[Push Integration] Already subscribed');
      return;
    } else if (currentPermission === 'denied') {
      console.log('[Push Integration] Notifications blocked by user');
      return;
    }

    // Check if user has already been through bot check in this session
    const botCheckDone = sessionStorage.getItem(`push_bot_check_${PUSH_CONFIG.landingId}`);
    
    if (!botCheckDone) {
      // Redirect to bot check page
      const currentUrl = window.location.href;
      const botCheckUrl = `${PUSH_CONFIG.appUrl}/landing/bot-check?landingId=${PUSH_CONFIG.landingId}&redirect=${encodeURIComponent(currentUrl)}`;
      
      console.log('[Push Integration] Redirecting to bot check:', botCheckUrl);
      window.location.href = botCheckUrl;
    } else {
      console.log('[Push Integration] Bot check already completed, but permission is still default');
      // The bot check page should have handled the permission request
      // If we're here with default permission, something went wrong
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPushNotifications);
  } else {
    initPushNotifications();
  }
})();