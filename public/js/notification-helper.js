// Notification Helper - Detects and helps fix notification issues

const NotificationHelper = {
  // Check all notification requirements
  async checkRequirements() {
    const checks = {
      browserSupport: 'serviceWorker' in navigator && 'PushManager' in window,
      httpsRequired: location.protocol === 'https:' || location.hostname === 'localhost',
      permission: Notification.permission,
      serviceWorker: false,
      pushSubscription: false,
      osBlocking: false
    };

    // Check service worker
    if (checks.browserSupport) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        checks.serviceWorker = registrations.length > 0;
        
        if (checks.serviceWorker) {
          const reg = registrations[0];
          const sub = await reg.pushManager.getSubscription();
          checks.pushSubscription = !!sub;
        }
      } catch (e) {
        console.error('SW check error:', e);
      }
    }

    // Check if OS is blocking
    if (checks.permission === 'granted' && checks.serviceWorker) {
      checks.osBlocking = await this.detectOSBlocking();
    }

    return checks;
  },

  // Detect if OS/browser is blocking notifications
  async detectOSBlocking() {
    try {
      const reg = await navigator.serviceWorker.ready;
      
      // Create a test notification
      await reg.showNotification('Quick Test', {
        body: 'Testing notification system',
        tag: 'os-test',
        requireInteraction: false
      });

      // Wait and check if visible
      await new Promise(resolve => setTimeout(resolve, 500));
      const notifications = await reg.getNotifications({ tag: 'os-test' });
      
      // Clean up
      notifications.forEach(n => n.close());
      
      // If no notifications found, OS is likely blocking
      return notifications.length === 0;
    } catch (e) {
      console.error('OS blocking detection error:', e);
      return false;
    }
  },

  // Get specific guidance based on the issue
  getGuidance(checks) {
    if (!checks.browserSupport) {
      return {
        issue: 'Browser not supported',
        steps: ['Use Chrome, Firefox, Edge, or Safari 16.4+']
      };
    }

    if (!checks.httpsRequired) {
      return {
        issue: 'HTTPS required',
        steps: ['Push notifications only work on HTTPS websites']
      };
    }

    if (checks.permission === 'denied') {
      return {
        issue: 'Permission denied',
        steps: [
          'Click the lock icon in address bar',
          'Find "Notifications" and change to "Allow"',
          'Refresh the page'
        ]
      };
    }

    if (checks.permission === 'default') {
      return {
        issue: 'Permission not granted',
        steps: ['Click "Allow" when prompted for notifications']
      };
    }

    if (!checks.serviceWorker) {
      return {
        issue: 'Service worker not registered',
        steps: ['Refresh the page', 'Clear browser cache if issue persists']
      };
    }

    if (!checks.pushSubscription) {
      return {
        issue: 'Not subscribed to push',
        steps: ['Complete the subscription process']
      };
    }

    if (checks.osBlocking) {
      return {
        issue: 'System is blocking notifications',
        steps: [
          'Windows: Turn off Focus Assist (Settings → System → Focus assist)',
          'Windows: Allow Chrome in Settings → System → Notifications',
          'Mac: Check System Preferences → Notifications → Chrome',
          'Check if Do Not Disturb mode is ON',
          'Notifications may appear in Action Center/Notification Center'
        ]
      };
    }

    return {
      issue: 'Everything looks good',
      steps: ['Notifications should be working']
    };
  },

  // Show a help dialog to the user
  async showHelpDialog() {
    const checks = await this.checkRequirements();
    const guidance = this.getGuidance(checks);
    
    let message = `🔔 Notification Status\n\n`;
    message += `Issue: ${guidance.issue}\n\n`;
    
    if (guidance.steps.length > 0) {
      message += 'Steps to fix:\n';
      guidance.steps.forEach((step, i) => {
        message += `${i + 1}. ${step}\n`;
      });
    }

    // Add system info
    message += '\n📊 System Check:\n';
    message += `✓ Browser Support: ${checks.browserSupport ? 'Yes' : 'No'}\n`;
    message += `✓ HTTPS: ${checks.httpsRequired ? 'Yes' : 'No'}\n`;
    message += `✓ Permission: ${checks.permission}\n`;
    message += `✓ Service Worker: ${checks.serviceWorker ? 'Yes' : 'No'}\n`;
    message += `✓ Push Subscription: ${checks.pushSubscription ? 'Yes' : 'No'}\n`;
    message += `✓ OS Blocking: ${checks.osBlocking ? 'Yes ⚠️' : 'No'}\n`;

    alert(message);

    // Open help page if OS is blocking
    if (checks.osBlocking) {
      if (confirm('\nWould you like to open the Chrome help page?')) {
        window.open('https://support.google.com/chrome/answer/3220216', '_blank');
      }
    }
  }
};

// Make it globally available
window.NotificationHelper = NotificationHelper;