// Simplified Push Widget - Works with regular service worker
(function(window) {
  'use strict';
  
  console.log('[PushWidget-Simple] Script loaded');
  
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
    console.log('[PushWidget-Simple] Initializing');
    
    const PushWidget = {
      config: config,
      
      init: function() {
        // Check if already subscribed
        const subscriptionKey = 'push-subscribed-' + config.landingId;
        if (localStorage.getItem(subscriptionKey) === 'true') {
          console.log('[PushWidget-Simple] Already subscribed');
          return;
        }
        
        // Show bot check if enabled
        if (this.config.botProtection !== false) {
          console.log('[PushWidget-Simple] Showing bot check');
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
        
        // Create white overlay
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
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        `;
        
        // Create loading message
        const loading = document.createElement('div');
        loading.style.cssText = `
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #333;
        `;
        loading.innerHTML = '<h2>Loading security check...</h2>';
        overlay.appendChild(loading);
        
        // Create iframe for bot check
        const iframe = document.createElement('iframe');
        iframe.id = 'push-bot-check-iframe';
        iframe.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          background: white;
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
        
        // Log the URL for debugging
        console.log('[PushWidget-Simple] Bot check URL:', iframe.src);
        
        iframe.onload = function() {
          console.log('[PushWidget-Simple] Bot check iframe loaded');
          loading.style.display = 'none';
        };
        
        iframe.onerror = function() {
          console.error('[PushWidget-Simple] Failed to load bot check');
          loading.innerHTML = '<h2>Error loading security check</h2>';
        };
        
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        
        // Listen for messages
        window.addEventListener('message', this.handleMessage.bind(this));
      },
      
      handleMessage: function(event) {
        console.log('[PushWidget-Simple] Message from:', event.origin, 'Type:', event.data.type);
        
        // Only accept messages from our app
        if (event.origin !== this.config.appUrl) {
          return;
        }
        
        if (event.data.type === 'bot-check-verified') {
          console.log('[PushWidget-Simple] Bot check verified, requesting permission');
          this.requestPermission(event.data);
        } else if (event.data.type === 'bot-check-completed') {
          console.log('[PushWidget-Simple] Bot check completed with:', event.data.permission);
          if (event.data.permission === 'denied') {
            if (this.config.redirects?.onBlock) {
              window.location.href = this.config.redirects.onBlock;
            } else {
              this.closeOverlay();
            }
          }
        }
      },
      
      requestPermission: async function(botCheckData) {
        try {
          const permission = await Notification.requestPermission();
          console.log('[PushWidget-Simple] Permission result:', permission);
          
          if (permission === 'granted') {
            // For now, just mark as subscribed and close
            localStorage.setItem('push-subscribed-' + this.config.landingId, 'true');
            
            if (this.config.redirects?.onAllow) {
              window.location.href = this.config.redirects.onAllow;
            } else {
              this.closeOverlay();
            }
          } else {
            if (this.config.redirects?.onBlock) {
              window.location.href = this.config.redirects.onBlock;
            } else {
              this.closeOverlay();
            }
          }
        } catch (error) {
          console.error('[PushWidget-Simple] Error requesting permission:', error);
          this.closeOverlay();
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