// Push Notification Widget for Customer Websites
// This file is loaded from YOUR domain onto CUSTOMER domains

(function(window) {
  'use strict';
  
  // Auto-initialize if PUSH_CONFIG exists
  if (window.PUSH_CONFIG) {
    initWidget(window.PUSH_CONFIG);
  }
  
  function initWidget(config) {
    // If widget already exists, reinitialize with new config
    if (window.PushWidget) {
      window.PushWidget.config = config;
      window.PushWidget.init();
      return;
    }
    const PushWidget = {
      config: config,
      subscribed: false,
      
      init: function() {
      
      // Check if we're returning from bot check
      const urlParams = new URLSearchParams(window.location.search);
      const fromBotCheck = urlParams.get('push-subscribed') === 'true';
      const justSubscribed = urlParams.get('push-landing-id') === config.landingId;
      
      // If returning from successful subscription, mark as subscribed and clean URL
      if (fromBotCheck && justSubscribed) {
        const subscriptionKey = 'push-subscribed-' + config.landingId;
        localStorage.setItem(subscriptionKey, 'true');
        this.subscribed = true;
        
        // Clean up URL parameters
        urlParams.delete('push-subscribed');
        urlParams.delete('push-landing-id');
        const cleanUrl = window.location.pathname + 
          (urlParams.toString() ? '?' + urlParams.toString() : '') + 
          window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        return;
      }
      
      // Check if already subscribed locally
      const subscriptionKey = 'push-subscribed-' + config.landingId;
      if (localStorage.getItem(subscriptionKey) === 'true') {
        this.subscribed = true;
        return;
      }
      
      // Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return;
      }
      
      // Check if already has push subscription
      this.checkExistingSubscription().then(hasSubscription => {
        if (hasSubscription) {
          localStorage.setItem(subscriptionKey, 'true');
          this.subscribed = true;
          return;
        }
        
        // Always request permission first (native browser prompt)
        this.requestPermissionFirst();
      });
    },
    
    checkExistingSubscription: async function() {
      try {
        // Check if service worker exists
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) {
          return false;
        }
        
        // Check for push subscription
        for (const registration of registrations) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            return true;
          }
        }
        
        return false;
      } catch (error) {
        console.error('Error checking existing subscription:', error);
        return false;
      }
    },
    
    showBotCheckOverlay: function() {
      // Create full page white overlay
      const overlay = document.createElement('div');
      overlay.id = 'push-widget-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #ffffff;
        z-index: 999998;
      `;
      
      // Create iframe that takes full page
      const iframe = document.createElement('iframe');
      iframe.id = 'push-widget-iframe';
      iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        position: absolute;
        top: 0;
        left: 0;
      `;
      
      // Build bot check URL
      const params = new URLSearchParams({
        landingId: this.config.landingId,
        domain: window.location.hostname,
        url: window.location.href,
        embedded: 'true',
        vapidKey: this.config.vapidKey,
        allowRedirect: this.config.redirects?.onAllow || '',
        blockRedirect: this.config.redirects?.onBlock || ''
      });
      
      iframe.src = this.config.appUrl + '/landing/bot-check?' + params.toString();
      
      // Append iframe to overlay
      overlay.appendChild(iframe);
      document.body.appendChild(overlay);
      
      // Listen for messages from iframe
      window.addEventListener('message', this.handleMessage.bind(this));
    },
    
    redirectToBotCheck: function() {
      // Use overlay instead of redirect
      this.showBotCheckOverlay();
    },
      
      requestPermissionFirst: async function() {
      try {
        // Request permission immediately
        const permission = await Notification.requestPermission();
        console.log('Permission result:', permission);
        
        if (permission === 'granted') {
          // Now show bot check if enabled
          if (this.config.botProtection || this.config.botCheck !== false) {
            this.permissionGranted = true;
            this.showBotCheckOverlay();
          } else {
            // No bot check, proceed with registration
            await this.registerPushSubscription({
              browserInfo: this.getBrowserInfo(),
              location: { country: 'Unknown', city: 'Unknown' }
            });
          }
        } else if (permission === 'denied') {
          this.handleDenied();
        }
        // If 'default' (dismissed), do nothing
      } catch (error) {
        console.error('Error requesting permission:', error);
      }
    },
    
    requestPermission: async function() {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await this.registerPushSubscription({
            browserInfo: this.getBrowserInfo(),
            location: { country: 'Unknown', city: 'Unknown' }
          });
        } else {
          this.handleDenied();
        }
      } catch (error) {
        console.error('Error requesting permission:', error);
      }
    },
    
    getBrowserInfo: function() {
      const ua = navigator.userAgent;
      let browser = 'Unknown';
      let browserVersion = 'Unknown';
      
      if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
        browser = 'Chrome';
        browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
        browser = 'Safari';
        browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('Firefox') > -1) {
        browser = 'Firefox';
        browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
      } else if (ua.indexOf('Edg') > -1) {
        browser = 'Edge';
        browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
      }
      
      const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
      const deviceType = isMobile ? 'Mobile' : 'Desktop';
      
      const os = ua.indexOf('Win') > -1 ? 'Windows' :
                 ua.indexOf('Mac') > -1 ? 'macOS' :
                 ua.indexOf('Linux') > -1 ? 'Linux' :
                 ua.indexOf('Android') > -1 ? 'Android' :
                 ua.indexOf('iOS') > -1 ? 'iOS' : 'Unknown';
      
      return {
        browser,
        version: browserVersion,
        os,
        device: deviceType,
        userAgent: ua,
        language: navigator.language,
        platform: navigator.platform
      };
    },
    
    showBotCheck: function() {
      // This is now legacy - keeping for backward compatibility
      this.redirectToBotCheck();
    },
    
    handleMessage: function(event) {
      // Verify message origin
      if (event.origin !== this.config.appUrl) return;
      
      if (event.data.type === 'bot-check-verified') {
        // Bot check completed
        this.closeBotCheck();
        
        // If permission was already granted, proceed with registration
        if (this.permissionGranted) {
          this.registerPushSubscription(event.data);
        }
      }
    },
    
    closeBotCheck: function() {
      const overlay = document.getElementById('push-widget-overlay');
      const iframe = document.getElementById('push-widget-iframe');
      if (overlay) overlay.remove();
      if (iframe) iframe.remove();
    },
    
    registerPushSubscription: async function(data) {
      try {
        // First check if service worker is available on this domain
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.warn('Push notifications not supported on this domain');
          
          // Still save the permission grant to our server
          await this.saveSubscriptionToServer({
            endpoint: `granted-${Date.now()}-${Math.random()}`,
            keys: {
              p256dh: 'permission-granted',
              auth: 'permission-granted'
            }
          }, data);
          
          return;
        }
        
        // Check if push-sw.js exists on customer's domain
        try {
          const swCheck = await fetch('/push-sw.js', { method: 'HEAD' });
          if (!swCheck.ok) {
            console.warn('Service worker not found on this domain');
            
            // Save permission grant without actual subscription
            await this.saveSubscriptionToServer({
              endpoint: `granted-no-sw-${Date.now()}-${Math.random()}`,
              keys: {
                p256dh: 'no-service-worker',
                auth: 'no-service-worker'
              }
            }, data);
            
            return;
          }
        } catch (e) {
          console.warn('Could not check for service worker:', e);
        }
        
        // Register service worker on customer's domain
        const registration = await navigator.serviceWorker.register('/push-sw.js');
        await navigator.serviceWorker.ready;
        
        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidKey)
        });
        
        // Save to server
        await this.saveSubscriptionToServer(subscription.toJSON(), data);
        
      } catch (error) {
        console.error('Failed to subscribe:', error);
        
        // Even if subscription fails, save that permission was granted
        await this.saveSubscriptionToServer({
          endpoint: `granted-error-${Date.now()}-${Math.random()}`,
          keys: {
            p256dh: 'subscription-error',
            auth: error.message
          }
        }, data);
      }
    },
    
    saveSubscriptionToServer: async function(subscription, data) {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        // Add ngrok header only if using ngrok
        if (this.config.appUrl.includes('ngrok')) {
          headers['ngrok-skip-browser-warning'] = 'true';
        }
        
        const response = await fetch(this.config.appUrl + '/api/clients', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            subscription: subscription,
            landingId: this.config.landingId,
            domain: window.location.hostname,
            url: window.location.href,
            accessStatus: 'allowed',
            browserInfo: data.browserInfo || this.getBrowserInfo(),
            location: data.location || { country: 'Unknown', city: 'Unknown' }
          })
        });
        
        if (response.ok) {
          // Mark as subscribed
          localStorage.setItem('push-subscribed-' + this.config.landingId, 'true');
          this.subscribed = true;
          
          // Redirect if configured
          if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onAllow) {
            window.location.href = this.config.redirects.onAllow;
          }
        }
      } catch (error) {
        console.error('Failed to save subscription:', error);
      }
    },
    
    handleDenied: function() {
      // Save denied status to server
      this.saveDeniedStatus();
      
      // Redirect if configured
      if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
        window.location.href = this.config.redirects.onBlock;
      }
    },
    
    saveDeniedStatus: async function() {
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (this.config.appUrl.includes('ngrok')) {
          headers['ngrok-skip-browser-warning'] = 'true';
        }
        
        await fetch(this.config.appUrl + '/api/clients', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            subscription: {
              endpoint: `blocked-${Date.now()}-${Math.random()}`,
              keys: {
                p256dh: 'blocked',
                auth: 'blocked'
              }
            },
            landingId: this.config.landingId,
            domain: window.location.hostname,
            url: window.location.href,
            accessStatus: 'blocked',
            browserInfo: this.getBrowserInfo(),
            location: { country: 'Unknown', city: 'Unknown' }
          })
        });
      } catch (error) {
        console.error('Failed to save denied status:', error);
      }
    },
    
    urlBase64ToUint8Array: function(base64String) {
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
  };
  
  // Initialize the widget
  PushWidget.init();
  
  // Expose for debugging
  window.PushWidget = PushWidget;
  }
})(window);