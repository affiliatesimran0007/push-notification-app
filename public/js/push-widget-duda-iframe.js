// Push Notification Widget for Duda - Iframe Approach
// This version works when service workers can't be hosted on the same domain

(function(window) {
  'use strict';
  
  console.log('[PushWidget-Duda-Iframe] Script loaded');
  
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
    console.log('[PushWidget-Duda-Iframe] Initializing with config:', config);
    
    const PushWidget = {
      config: config,
      
      init: function() {
        // Check if we should show bot protection
        if (this.config.botProtection !== false) {
          console.log('[PushWidget-Duda-Iframe] Bot protection enabled');
          this.showBotCheckOverlay();
        }
      },
      
      showBotCheckOverlay: function() {
        if (!document.body) {
          setTimeout(() => this.showBotCheckOverlay(), 50);
          return;
        }
        
        // Hide page content
        document.body.style.visibility = 'hidden';
        document.body.style.overflow = 'hidden';
        
        // Create overlay
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
        
        // Create iframe for bot check
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
          width: 100%;
          height: 100%;
          border: none;
        `;
        
        // Build bot check URL with special parameter for Duda
        const params = new URLSearchParams({
          landingId: this.config.landingId,
          domain: this.config.domain,
          url: window.location.href,
          embedded: 'true',
          vapidKey: this.config.vapidKey,
          dudaMode: 'true', // Special flag for Duda sites
          externalRegistration: 'true', // Indicates registration will happen externally
          allowRedirect: this.config.redirects?.onAllow || '',
          blockRedirect: this.config.redirects?.onBlock || ''
        });
        
        iframe.src = this.config.appUrl + '/landing/bot-check?' + params.toString();
        
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        
        // Listen for messages
        window.addEventListener('message', this.handleMessage.bind(this));
      },
      
      handleMessage: function(event) {
        if (event.origin !== this.config.appUrl) return;
        
        console.log('[PushWidget-Duda-Iframe] Received message:', event.data.type);
        
        if (event.data.type === 'bot-check-completed') {
          // For Duda, we'll handle the redirect directly
          if (event.data.permission === 'granted') {
            // User allowed - redirect to registration page
            const registrationUrl = this.config.appUrl + '/register?' + new URLSearchParams({
              landingId: this.config.landingId,
              domain: this.config.domain,
              redirect: this.config.redirects?.onAllow || window.location.href
            });
            window.location.href = registrationUrl;
          } else {
            // User blocked
            if (this.config.redirects?.onBlock) {
              window.location.href = this.config.redirects.onBlock;
            } else {
              this.closeOverlay();
            }
          }
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