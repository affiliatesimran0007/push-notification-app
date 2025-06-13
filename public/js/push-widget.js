// Push Notification Widget for Customer Websites
// This file is loaded from YOUR domain onto CUSTOMER domains

(function(window) {
  'use strict';
  
  // Auto-initialize if PUSH_CONFIG exists
  if (window.PUSH_CONFIG) {
    initWidget(window.PUSH_CONFIG);
  }
  
  function initWidget(config) {
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
        
        // Immediately redirect to bot check page if enabled
        if (config.botCheck !== false) {
          this.redirectToBotCheck();
        } else {
          this.requestPermission();
        }
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
    
    redirectToBotCheck: function() {
      // Store the current page URL to return to
      sessionStorage.setItem('push-widget-return-url', window.location.href);
      
      // Build bot check URL with parameters
      const params = new URLSearchParams({
        landingId: this.config.landingId,
        domain: window.location.hostname,
        url: window.location.href,
        allowRedirect: this.config.redirects?.allow || window.location.href,
        blockRedirect: this.config.redirects?.block || window.location.href,
        vapidKey: this.config.vapidKey
      });
      
      // Redirect to bot check page
      // Add ngrok header for free accounts if needed
      const redirectUrl = this.config.appUrl + '/landing/bot-check?' + params.toString();
      if (this.config.appUrl.includes('ngrok')) {
        window.location.href = redirectUrl + '&ngrok-skip-browser-warning=true';
      } else {
        window.location.href = redirectUrl;
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
      
      if (event.data.type === 'bot-check-completed') {
        if (event.data.permission === 'granted') {
          this.registerPushSubscription(event.data);
        } else {
          this.handleDenied();
        }
        this.closeBotCheck();
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
        // Register service worker on customer's domain
        const registration = await navigator.serviceWorker.register('/push-sw.js');
        
        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidKey)
        });
        
        // Send to your server
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
            subscription: subscription.toJSON(),
            landingId: this.config.landingId,
            domain: window.location.hostname,
            url: window.location.href,
            browserInfo: data.browserInfo,
            location: data.location
          })
        });
        
        if (response.ok) {
          // Mark as subscribed
          localStorage.setItem('push-subscribed-' + this.config.landingId, 'true');
          this.subscribed = true;
          
          // Redirect if configured
          if (this.config.redirects && this.config.redirects.allow) {
            window.location.href = this.config.redirects.allow;
          }
        }
      } catch (error) {
        console.error('Failed to subscribe:', error);
      }
    },
    
    handleDenied: function() {
      // Redirect if configured
      if (this.config.redirects && this.config.redirects.block) {
        window.location.href = this.config.redirects.block;
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