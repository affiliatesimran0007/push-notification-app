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
        this.iframe.style.display = 'none';
        this.iframe.src = this.config.subdomainUrl || 'https://push.usproadvisor.com';
        document.body.appendChild(this.iframe);
      },
      
      showBotCheckOverlay: function() {
        if (!document.body) {
          setTimeout(() => this.showBotCheckOverlay(), 50);
          return;
        }
        
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
        `;
        
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
          width: 100%;
          height: 100%;
          border: none;
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
        
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        
        window.addEventListener('message', this.handleMessage.bind(this));
      },
      
      handleMessage: function(event) {
        console.log('[PushWidget-Subdomain] Received message:', event.data.type);
        
        if (event.origin === this.config.appUrl) {
          // Handle bot check messages
          if (event.data.type === 'bot-check-verified') {
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
          // Request permission on main domain
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            // Send registration request to subdomain
            this.iframe.contentWindow.postMessage({
              type: 'REGISTER_PUSH',
              vapidKey: this.config.vapidKey,
              clientData: {
                landingId: this.config.landingId,
                domain: this.config.domain,
                browserInfo: botCheckData.browserInfo,
                location: botCheckData.location
              }
            }, this.config.subdomainUrl || 'https://push.usproadvisor.com');
          } else {
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
      }
    };
    
    PushWidget.init();
    window.PushWidget = PushWidget;
  }
})(window);