// Push Notification Widget for Sites with Subdomain Service Worker
// This version uses a subdomain to host the service worker

(function(window) {
  'use strict';
  
  console.log('[PushWidget-Subdomain] Script loaded');
  
  if (window.PUSH_CONFIG) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        initWidget(window.PUSH_CONFIG);
      });
    } else {
      initWidget(window.PUSH_CONFIG);
    }
  }
  
  function initWidget(config) {
    console.log('[PushWidget-Subdomain] Initializing with config:', config);
    
    const PushWidget = {
      config: config,
      iframe: null,
      
      init: function() {
        // Create hidden iframe to subdomain
        this.createSubdomainIframe();
        
        // Check for bot protection
        if (this.config.botProtection !== false) {
          this.showBotCheckOverlay();
        }
      },
      
      createSubdomainIframe: function() {
        // Create hidden iframe for cross-origin communication
        this.iframe = document.createElement('iframe');
        this.iframe.id = 'push-subdomain-iframe';
        this.iframe.style.display = 'none';
        this.iframe.src = this.config.subdomainUrl || 'https://push.usproadvisor.com';
        
        // Wait for iframe to load before appending
        this.iframe.onload = () => {
          console.log('[PushWidget-Subdomain] Subdomain iframe loaded');
        };
        
        this.iframe.onerror = () => {
          console.error('[PushWidget-Subdomain] Failed to load subdomain iframe');
        };
        
        document.body.appendChild(this.iframe);
      },
      
      showBotCheckOverlay: function() {
        if (!document.body) {
          setTimeout(() => this.showBotCheckOverlay(), 50);
          return;
        }
        
        console.log('[PushWidget-Subdomain] Creating bot check overlay');
        
        document.body.style.visibility = 'hidden';
        document.body.style.overflow = 'hidden';
        
        const overlay = document.createElement('div');
        overlay.id = 'push-widget-overlay';
        overlay.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: #ffffff !important;
          z-index: 2147483647 !important;
          display: block !important;
        `;
        
        const iframe = document.createElement('iframe');
        iframe.id = 'push-bot-check-iframe';
        iframe.style.cssText = `
          width: 100%;
          height: 100%;
          border: none;
          position: absolute;
          top: 0;
          left: 0;
        `;
        
        const params = new URLSearchParams({
          landingId: this.config.landingId,
          domain: this.config.domain,
          url: window.location.href,
          embedded: 'true',
          vapidKey: this.config.vapidKey,
          allowRedirect: this.config.redirects?.onAllow || '',
          blockRedirect: this.config.redirects?.onBlock || ''
        });
        
        iframe.src = this.config.appUrl + '/landing/bot-check?' + params.toString();
        
        console.log('[PushWidget-Subdomain] Bot check URL:', iframe.src);
        
        iframe.onload = function() {
          console.log('[PushWidget-Subdomain] Bot check iframe loaded successfully');
        };
        
        iframe.onerror = function() {
          console.error('[PushWidget-Subdomain] Bot check iframe failed to load');
        };
        
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        
        window.addEventListener('message', this.handleMessage.bind(this));
      },
      
      handleMessage: function(event) {
        console.log('[PushWidget-Subdomain] Received message from:', event.origin, 'Type:', event.data.type);
        
        if (event.origin === this.config.appUrl) {
          // Handle bot check messages
          if (event.data.type === 'bot-check-verified') {
            console.log('[PushWidget-Subdomain] Bot check verified, proceeding with permission request');
            this.requestPermissionWithSubdomain(event.data);
          } else if (event.data.type === 'request-permission-firefox') {
            // Handle Firefox/Edge special case
            console.log('[PushWidget-Subdomain] Firefox/Edge permission request');
            this.requestPermissionWithSubdomain(event.data);
          }
        } else if (event.origin === (this.config.subdomainUrl || 'https://push.usproadvisor.com')) {
          // Handle subdomain messages
          if (event.data.type === 'PUSH_REGISTERED') {
            this.handleSuccessfulRegistration(event.data);
          } else if (event.data.type === 'PUSH_ERROR') {
            this.handleRegistrationError(event.data);
          }
        }
      },
      
      requestPermissionWithSubdomain: async function(botCheckData) {
        try {
          console.log('[PushWidget-Subdomain] Requesting permission...');
          // Request permission on main domain
          const permission = await Notification.requestPermission();
          console.log('[PushWidget-Subdomain] Permission result:', permission);
          
          if (permission === 'granted') {
            console.log('[PushWidget-Subdomain] Permission granted, sending registration request to subdomain');
            
            // Convert VAPID key to Uint8Array for the subdomain
            const vapidUint8Array = this.urlBase64ToUint8Array(this.config.vapidKey);
            
            // Send registration request to subdomain
            this.iframe.contentWindow.postMessage({
              type: 'REGISTER_PUSH',
              vapidKey: vapidUint8Array,
              clientData: {
                landingId: this.config.landingId,
                domain: this.config.domain,
                browserInfo: botCheckData.browserInfo || this.getBrowserInfo(),
                location: botCheckData.location || { country: 'Unknown', city: 'Unknown' },
                url: window.location.href
              }
            }, this.config.subdomainUrl || 'https://push.usproadvisor.com');
            
            console.log('[PushWidget-Subdomain] Registration request sent to subdomain');
          } else {
            console.log('[PushWidget-Subdomain] Permission denied');
            // Handle denied
            if (this.config.redirects?.onBlock) {
              window.location.href = this.config.redirects.onBlock;
            } else {
              this.closeOverlay();
            }
          }
        } catch (error) {
          console.error('[PushWidget-Subdomain] Error:', error);
          this.closeOverlay();
        }
      },
      
      handleSuccessfulRegistration: function(data) {
        // Save subscription to server
        this.saveSubscription(data.subscription, data.data);
        
        // Mark as subscribed
        localStorage.setItem('push-subscribed-' + this.config.landingId, 'true');
        
        // Handle redirect or close
        if (this.config.redirects?.onAllow) {
          window.location.href = this.config.redirects.onAllow;
        } else {
          this.closeOverlay();
        }
      },
      
      handleRegistrationError: function(data) {
        console.error('[PushWidget-Subdomain] Registration error:', data.error);
        this.closeOverlay();
      },
      
      saveSubscription: async function(subscription, clientData) {
        try {
          const response = await fetch(this.config.appUrl + '/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: subscription,
              landingId: clientData.landingId,
              domain: clientData.domain,
              url: window.location.href,
              accessStatus: 'allowed',
              browserInfo: clientData.browserInfo,
              location: clientData.location
            })
          });
          
          console.log('[PushWidget-Subdomain] Subscription saved:', response.ok);
        } catch (error) {
          console.error('[PushWidget-Subdomain] Failed to save subscription:', error);
        }
      },
      
      closeOverlay: function() {
        const overlay = document.getElementById('push-widget-overlay');
        if (overlay) overlay.remove();
        
        if (document.body) {
          document.body.style.visibility = 'visible';
          document.body.style.overflow = '';
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
      },
      
      getBrowserInfo: function() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let browserVersion = 'Unknown';
        
        if (ua.indexOf('Edg') > -1) {
          browser = 'Edge';
          browserVersion = ua.match(/Edg[e]?\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Safari') > -1) {
          browser = 'Chrome';
          browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Firefox') > -1) {
          browser = 'Firefox';
          browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Safari') > -1) {
          browser = 'Safari';
          browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
        }
        
        const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
        const deviceType = isMobile ? 'Mobile' : 'Desktop';
        
        let os = 'Unknown';
        if (ua.indexOf('Windows') > -1) os = 'Windows';
        else if (ua.indexOf('Mac') > -1) os = 'macOS';
        else if (ua.indexOf('Linux') > -1) os = 'Linux';
        else if (ua.indexOf('Android') > -1) os = 'Android';
        else if (ua.indexOf('iOS') > -1) os = 'iOS';
        
        return {
          browser,
          version: browserVersion,
          os,
          device: deviceType,
          userAgent: ua,
          language: navigator.language,
          platform: navigator.platform
        };
      }
    };
    
    PushWidget.init();
    window.PushWidget = PushWidget;
  }
})(window);