/**
 * Browser Push Helper - Cross-browser push notification implementation
 * Handles Edge, Firefox, Chrome, Safari compatibility
 */

class BrowserPushHelper {
  constructor() {
    this.browserInfo = this.detectBrowser();
    this.isSupported = this.checkSupport();
  }

  detectBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    return {
      name: this.getBrowserName(ua),
      isChrome: ua.includes('chrome') && !ua.includes('edg/'),
      isEdge: ua.includes('edg/'),
      isFirefox: ua.includes('firefox'),
      isSafari: ua.includes('safari') && !ua.includes('chrome'),
      requiresUserGesture: ua.includes('firefox') || ua.includes('edg/'),
      version: this.getBrowserVersion(ua)
    };
  }

  getBrowserName(ua) {
    if (ua.includes('edg/')) return 'Edge';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari')) return 'Safari';
    return 'Unknown';
  }

  getBrowserVersion(ua) {
    const match = ua.match(/(chrome|firefox|safari|edg)\/(\d+)/i);
    return match ? parseInt(match[2]) : 0;
  }

  checkSupport() {
    const checks = {
      https: location.protocol === 'https:' || location.hostname === 'localhost',
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window
    };

    // Log issues for debugging
    if (!checks.https) {
      console.error('Push notifications require HTTPS');
    }
    if (!checks.serviceWorker) {
      console.error('Service Workers not supported');
    }
    if (!checks.pushManager) {
      console.error('Push API not supported');
    }
    if (!checks.notification) {
      console.error('Notification API not supported');
    }

    return Object.values(checks).every(v => v);
  }

  // Main permission request method
  async requestPermission(options = {}) {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported in this browser');
    }

    // Check if already denied
    if (Notification.permission === 'denied') {
      this.showPermissionDeniedInstructions();
      return 'denied';
    }

    // For Firefox and Edge, ensure user gesture
    if (this.browserInfo.requiresUserGesture && !options.fromUserGesture) {
      console.warn(`${this.browserInfo.name} requires user interaction for notifications`);
      return this.showCustomPrompt();
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Additional setup for specific browsers
        if (this.browserInfo.isEdge) {
          await this.setupEdgeNotifications();
        }
      }
      
      return permission;
    } catch (error) {
      console.error('Permission request failed:', error);
      throw error;
    }
  }

  // Show custom prompt for browsers requiring user gesture
  showCustomPrompt() {
    return new Promise((resolve) => {
      const promptHtml = `
        <div id="custom-push-prompt" style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          max-width: 400px;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="display: flex; align-items: start; gap: 16px;">
            <div style="
              width: 48px;
              height: 48px;
              background: #f0f0f0;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            ">
              🔔
            </div>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
                Enable Notifications
              </h3>
              <p style="margin: 0 0 16px 0; color: #666; font-size: 14px; line-height: 1.5;">
                Get instant updates about your orders, special offers, and important announcements.
              </p>
              <div style="display: flex; gap: 12px;">
                <button id="allow-push-btn" style="
                  background: #0066cc;
                  color: white;
                  border: none;
                  padding: 10px 24px;
                  border-radius: 8px;
                  font-size: 14px;
                  font-weight: 500;
                  cursor: pointer;
                  transition: background 0.2s;
                " onmouseover="this.style.background='#0052a3'" onmouseout="this.style.background='#0066cc'">
                  Allow Notifications
                </button>
                <button id="deny-push-btn" style="
                  background: transparent;
                  color: #666;
                  border: 1px solid #ddd;
                  padding: 10px 24px;
                  border-radius: 8px;
                  font-size: 14px;
                  cursor: pointer;
                  transition: all 0.2s;
                " onmouseover="this.style.borderColor='#999'" onmouseout="this.style.borderColor='#ddd'">
                  Not Now
                </button>
              </div>
              <p style="margin: 12px 0 0 0; color: #999; font-size: 12px;">
                ${this.browserInfo.name} requires your permission to show notifications
              </p>
            </div>
          </div>
        </div>
      `;

      // Remove any existing prompt
      const existing = document.getElementById('custom-push-prompt');
      if (existing) existing.remove();

      // Add to page
      document.body.insertAdjacentHTML('beforeend', promptHtml);

      // Handle buttons
      document.getElementById('allow-push-btn').addEventListener('click', async () => {
        document.getElementById('custom-push-prompt').remove();
        try {
          const permission = await Notification.requestPermission();
          resolve(permission);
        } catch (error) {
          console.error('Permission request failed:', error);
          resolve('default');
        }
      });

      document.getElementById('deny-push-btn').addEventListener('click', () => {
        document.getElementById('custom-push-prompt').remove();
        resolve('default');
      });

      // Auto-hide after 30 seconds
      setTimeout(() => {
        const prompt = document.getElementById('custom-push-prompt');
        if (prompt) {
          prompt.remove();
          resolve('default');
        }
      }, 30000);
    });
  }

  // Show instructions for resetting denied permissions
  showPermissionDeniedInstructions() {
    const instructions = {
      Chrome: 'Click the lock icon in the address bar → Site settings → Notifications → Allow',
      Firefox: 'Click the lock icon → Clear permissions and try again',
      Edge: 'Click the lock icon → Permissions → Notifications → Allow',
      Safari: 'Safari → Settings → Websites → Notifications → Allow'
    };

    alert(`Notifications are blocked. To enable:\n\n${instructions[this.browserInfo.name] || instructions.Chrome}`);
  }

  // Edge-specific setup
  async setupEdgeNotifications() {
    // Check Windows notification settings
    if ('windowsNotificationSettings' in navigator) {
      try {
        const settings = await navigator.windowsNotificationSettings.getSettings();
        if (!settings.enabled) {
          console.warn('Windows notifications are disabled. Please enable in Windows Settings.');
        }
      } catch (e) {
        // API might not be available
      }
    }
  }

  // Register service worker with browser-specific handling
  async registerServiceWorker(swPath = '/sw.js') {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers not supported');
    }

    try {
      // Firefox prefers service worker at root
      if (this.browserInfo.isFirefox && !swPath.startsWith('/')) {
        swPath = '/' + swPath;
      }

      const registration = await navigator.serviceWorker.register(swPath, {
        scope: '/',
        updateViaCache: 'none' // Important for Edge
      });

      // Wait for activation
      await navigator.serviceWorker.ready;

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Subscribe to push with browser-specific handling
  async subscribeToPush(registration, vapidPublicKey) {
    try {
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('Already subscribed');
        return subscription;
      }

      // Convert VAPID key
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe with browser-specific options
      const options = {
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      };

      // Edge sometimes needs a retry
      if (this.browserInfo.isEdge) {
        try {
          subscription = await registration.pushManager.subscribe(options);
        } catch (error) {
          console.log('Edge subscription failed, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          subscription = await registration.pushManager.subscribe(options);
        }
      } else {
        subscription = await registration.pushManager.subscribe(options);
      }

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      
      // Provide browser-specific error messages
      if (error.message.includes('gcm_sender_id')) {
        throw new Error('Invalid VAPID key or manifest configuration');
      }
      
      throw error;
    }
  }

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
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

  // Complete setup flow
  async setupPushNotifications(vapidPublicKey, options = {}) {
    try {
      // 1. Check support
      if (!this.isSupported) {
        throw new Error(`Push notifications not supported in ${this.browserInfo.name}`);
      }

      // 2. Request permission
      const permission = await this.requestPermission(options);
      if (permission !== 'granted') {
        console.log('Permission not granted:', permission);
        return null;
      }

      // 3. Register service worker
      const registration = await this.registerServiceWorker(options.swPath);

      // 4. Subscribe to push
      const subscription = await this.subscribeToPush(registration, vapidPublicKey);

      console.log('Push notification setup complete:', {
        browser: this.browserInfo.name,
        version: this.browserInfo.version,
        endpoint: subscription.endpoint
      });

      return subscription;
    } catch (error) {
      console.error('Push setup failed:', error);
      throw error;
    }
  }
}

// Export for use
window.BrowserPushHelper = BrowserPushHelper;