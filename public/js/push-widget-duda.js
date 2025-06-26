// Push Notification Widget for Duda and Custom Service Worker Paths
// This version supports service workers hosted in non-root directories

(function(window) {
  'use strict';
  
  console.log('[PushWidget-Duda] Script loaded, checking for PUSH_CONFIG...');
  
  // Auto-initialize if PUSH_CONFIG exists
  if (window.PUSH_CONFIG) {
    console.log('[PushWidget-Duda] PUSH_CONFIG found:', window.PUSH_CONFIG);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        initWidget(window.PUSH_CONFIG);
      });
    } else {
      initWidget(window.PUSH_CONFIG);
    }
  }
  
  function initWidget(config) {
    console.log('[PushWidget-Duda] initWidget called with config:', config);
    
    if (window.PushWidget) {
      console.log('[PushWidget-Duda] Widget already exists, reinitializing...');
      window.PushWidget.config = config;
      window.PushWidget.init();
      return;
    }
    
    const PushWidget = {
      config: config,
      subscribed: false,
      permissionResult: null,
      botCheckData: null,
      botCheckCompleted: false,
      overlayShown: false,
      swRegistration: null,
      
      init: function() {
        // Pre-register service worker with custom path support
        this.preRegisterServiceWorker();
        
        // Rest of initialization logic...
        this.completePendingRegistrations();
        
        const urlParams = new URLSearchParams(window.location.search);
        const fromBotCheck = urlParams.get('push-subscribed') === 'true';
        const justSubscribed = urlParams.get('push-landing-id') === config.landingId;
        
        if (fromBotCheck && justSubscribed) {
          const subscriptionKey = 'push-subscribed-' + config.landingId;
          localStorage.setItem(subscriptionKey, 'true');
          this.subscribed = true;
          
          urlParams.delete('push-subscribed');
          urlParams.delete('push-landing-id');
          const cleanUrl = window.location.pathname + 
            (urlParams.toString() ? '?' + urlParams.toString() : '') + 
            window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
          return;
        }
        
        const subscriptionKey = 'push-subscribed-' + config.landingId;
        if (localStorage.getItem(subscriptionKey) === 'true') {
          console.log('[PushWidget-Duda] Already subscribed');
          this.subscribed = true;
        }
        
        if (this.config.botProtection || this.config.botCheck !== false) {
          console.log('[PushWidget-Duda] Bot protection enabled, checking environment...');
          if (window.parent === window) {
            console.log('[PushWidget-Duda] Not in iframe, showing bot check overlay');
            this.showBotCheckOverlay();
            this.overlayShown = true;
            return;
          } else {
            console.log('[PushWidget-Duda] In iframe, skipping overlay');
            return;
          }
        } else {
          console.log('[PushWidget-Duda] Bot protection disabled');
        }
        
        if (!this.checkBrowserCompatibility()) {
          return;
        }
        
        if (!this.config.botProtection && this.config.botCheck === false) {
          this.checkExistingSubscription().then(hasSubscription => {
            console.log('[PushWidget-Duda] Existing subscription check:', hasSubscription);
            if (hasSubscription) {
              console.log('[PushWidget-Duda] Found existing subscription');
              localStorage.setItem(subscriptionKey, 'true');
              this.subscribed = true;
              return;
            }
            
            if (window.parent !== window) {
              console.log('Widget loaded in iframe, skipping auto-init');
              return;
            }
            
            this.initializeWithBrowserCheck();
          });
        }
      },
      
      preRegisterServiceWorker: async function() {
        try {
          if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
          }
          
          // Get service worker path - support custom paths
          const swPath = this.config.serviceWorkerPath || '/push-sw.js';
          console.log('[PushWidget-Duda] Using service worker path:', swPath);
          
          // Check if service worker already registered
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            // Check if this registration matches our service worker
            if (reg.active && reg.active.scriptURL.includes(swPath)) {
              console.log('[PushWidget-Duda] Service worker already registered');
              this.swRegistration = reg;
              return;
            }
          }
          
          // Register service worker with custom path
          console.log('[PushWidget-Duda] Pre-registering service worker at:', swPath);
          this.swRegistration = await navigator.serviceWorker.register(swPath, {
            updateViaCache: 'none'
          });
          console.log('[PushWidget-Duda] Service worker pre-registered successfully');
        } catch (error) {
          console.error('[PushWidget-Duda] Service worker pre-registration failed:', error);
          // Show user-friendly error for common issues
          if (error.message.includes('Failed to register a ServiceWorker')) {
            console.error('[PushWidget-Duda] Service worker file not found at:', this.config.serviceWorkerPath || '/push-sw.js');
            alert('Push notification setup error: Service worker file not found. Please check the file path.');
          }
        }
      },
      
      registerPushSubscription: async function(data) {
        try {
          if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications not supported on this domain');
            if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onAllow) {
              window.location.href = this.config.redirects.onAllow;
            }
            return;
          }
          
          let registration = this.swRegistration;
          
          if (!registration) {
            const swPath = this.config.serviceWorkerPath || '/push-sw.js';
            console.log('[PushWidget-Duda] Service worker not pre-registered, registering now at:', swPath);
            registration = await navigator.serviceWorker.register(swPath, {
              updateViaCache: 'none'
            });
          }
          
          await navigator.serviceWorker.ready;
          
          let subscription = await registration.pushManager.getSubscription();
          
          if (!subscription) {
            console.log('[PushWidget-Duda] Creating new subscription...');
            const browserInfo = this.getBrowserInfo();
            console.log('[PushWidget-Duda] Browser detected:', browserInfo.browser, browserInfo.version);
            
            const subscribeOptions = {
              userVisibleOnly: true,
              applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidKey)
            };
            
            if (browserInfo.browser === 'Safari' && parseInt(browserInfo.version) < 16) {
              delete subscribeOptions.applicationServerKey;
            }
            
            try {
              subscription = await registration.pushManager.subscribe(subscribeOptions);
              console.log('[PushWidget-Duda] Subscription successful!');
            } catch (subscribeError) {
              console.error('[PushWidget-Duda] Subscribe error:', subscribeError.name, subscribeError.message);
              throw subscribeError;
            }
          } else {
            console.log('[PushWidget-Duda] Using existing subscription');
          }
          
          if (registration.active) {
            console.log('[PushWidget-Duda] Service worker is active and ready');
          }
          
          this.saveSubscriptionFast(subscription.toJSON(), data);
          
        } catch (error) {
          console.error('[PushWidget-Duda] Failed to subscribe:', error);
          alert('Failed to subscribe to push notifications. Error: ' + error.message);
          
          if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
            window.location.href = this.config.redirects.onBlock;
          }
        }
      },
      
      // Include all other methods from the original push-widget.js
      // (completePendingRegistrations, checkExistingSubscription, showBotCheckOverlay, etc.)
      // Copy them exactly as they are, just update console.log prefixes to [PushWidget-Duda]
      
      completePendingRegistrations: async function() {
        try {
          const pendingReg = localStorage.getItem('push-pending-registration');
          if (!pendingReg) return;
          
          const pending = JSON.parse(pendingReg);
          
          if (pending.landingId === this.config.landingId && 
              Date.now() - pending.timestamp < 5 * 60 * 1000) {
            
            console.log('[PushWidget-Duda] Completing pending registration...');
            
            if (Notification.permission === 'granted') {
              await this.registerPushSubscription(pending.data);
              console.log('[PushWidget-Duda] Pending registration completed');
            }
            
            localStorage.removeItem('push-pending-registration');
          }
        } catch (error) {
          console.error('[PushWidget-Duda] Error completing pending registration:', error);
          localStorage.removeItem('push-pending-registration');
        }
      },
      
      checkExistingSubscription: async function() {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          if (registrations.length === 0) {
            return false;
          }
          
          for (const registration of registrations) {
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              return true;
            }
          }
          
          return false;
        } catch (error) {
          console.error('[PushWidget-Duda] Error checking existing subscription:', error);
          return false;
        }
      },
      
      showBotCheckOverlay: function() {
        if (!document.body) {
          console.warn('[PushWidget-Duda] Body not ready, waiting...');
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
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: all !important;
        `;
        
        const iframe = document.createElement('iframe');
        iframe.id = 'push-widget-iframe';
        iframe.style.cssText = `
          width: 100%;
          height: 100%;
          border: none;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 2147483647;
        `;
        
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
        
        console.log('[PushWidget-Duda] Bot check iframe URL:', iframe.src);
        
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);
        
        window.addEventListener('message', this.handleMessage.bind(this));
      },
      
      // ... Continue copying all other methods from original push-widget.js
      // Make sure to include ALL methods to ensure full functionality
      
      checkBrowserCompatibility: function() {
        const ua = navigator.userAgent;
        let isCompatible = true;
        let message = '';
        
        if (!('serviceWorker' in navigator)) {
          message = 'Service Workers not supported in this browser';
          isCompatible = false;
        } else if (!('PushManager' in window)) {
          message = 'Push API not supported in this browser';
          isCompatible = false;
        } else if (!('Notification' in window)) {
          message = 'Notifications not supported in this browser';
          isCompatible = false;
        }
        
        if (isCompatible) {
          if (/iPhone|iPad|iPod/.test(ua) && !window.MSStream) {
            const iOSVersion = parseFloat(
              ('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(ua) || [0,''])[1])
              .replace('undefined', '3_2').replace('_', '.').replace('_', '')
            ) || false;
            
            if (iOSVersion && iOSVersion < 16.4) {
              message = 'Push notifications require iOS 16.4 or later';
              isCompatible = false;
            }
          }
          
          if (ua.indexOf('Firefox') > -1 && ua.indexOf('Android') > -1) {
            console.warn('[PushWidget-Duda] Firefox on Android has limited push notification support');
          }
        }
        
        if (!isCompatible) {
          console.warn('[PushWidget-Duda] Browser compatibility issue:', message);
          if (this.config.showCompatibilityWarnings !== false) {
            console.info('To enable push notifications, please use a supported browser');
          }
        }
        
        return isCompatible;
      },
      
      getBrowserInfo: function() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        let browserVersion = 'Unknown';
        
        if (ua.indexOf('OPR') > -1 || ua.indexOf('Opera') > -1) {
          browser = 'Opera';
          browserVersion = ua.match(/(?:OPR|Opera)[\s\/]([\d.]+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('Edg') > -1) {
          browser = 'Edge';
          browserVersion = ua.match(/Edg[e]?\/(\d+)/)?.[1] || 'Unknown';
        } else if (ua.indexOf('SamsungBrowser') > -1) {
          browser = 'Samsung';
          browserVersion = ua.match(/SamsungBrowser\/(\d+)/)?.[1] || 'Unknown';
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
        
        if (window.brave && window.brave.isBrave) {
          browser = 'Brave';
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
      },
      
      handleMessage: function(event) {
        if (event.origin !== this.config.appUrl) return;
        
        if (event.data.type === 'bot-check-verified') {
          this.botCheckData = event.data;
          this.botCheckCompleted = true;
          this.requestPermissionWithBotCheck();
        } else if (event.data.type === 'bot-check-completed') {
          if (event.data.permission === 'granted') {
            this.closeBotCheck();
            console.log('[PushWidget-Duda] Push notifications enabled successfully');
          } else if (event.data.permission === 'denied') {
            this.closeBotCheck();
            console.log('[PushWidget-Duda] Push notifications were blocked');
          }
        } else if (event.data.type === 'request-permission-firefox') {
          console.log('[PushWidget-Duda] Firefox/Edge permission request received from iframe');
          this.handleFirefoxEdgePermission(event.data);
        }
      },
      
      closeBotCheck: function() {
        const overlay = document.getElementById('push-widget-overlay');
        if (overlay) overlay.remove();
        
        if (document.body) {
          document.body.style.visibility = 'visible';
          document.body.style.overflow = '';
        }
        
        window.removeEventListener('message', this.handleMessage.bind(this));
      },
      
      requestPermissionWithBotCheck: async function() {
        try {
          console.log('[PushWidget-Duda] Requesting permission while bot check remains visible');
          
          const permission = await Notification.requestPermission();
          console.log('Permission result:', permission);
          
          if (permission === 'granted') {
            console.log('[PushWidget-Duda] Permission granted, registering subscription...');
            
            const registrationData = this.botCheckData || {
              browserInfo: this.getBrowserInfo(),
              location: { country: 'Unknown', city: 'Unknown' }
            };
            
            await this.registerPushSubscription(registrationData);
            
            if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onAllow) {
              console.log('[PushWidget-Duda] Registration complete, redirecting...');
              window.location.href = this.config.redirects.onAllow;
            }
          } else if (permission === 'denied') {
            if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
              console.log('[PushWidget-Duda] Permission denied, redirecting to:', this.config.redirects.onBlock);
              window.location.href = this.config.redirects.onBlock;
            }
            this.saveDeniedStatus();
          } else {
            if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
              console.log('[PushWidget-Duda] Permission dismissed, redirecting to:', this.config.redirects.onBlock);
              window.location.href = this.config.redirects.onBlock;
            }
            this.saveDeniedStatus();
          }
          
          this.botCheckData = null;
          this.botCheckCompleted = false;
        } catch (error) {
          console.error('[PushWidget-Duda] Error requesting permission:', error);
          this.closeBotCheck();
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
          console.error('[PushWidget-Duda] Error requesting permission:', error);
        }
      },
      
      initializeWithBrowserCheck: function() {
        const ua = navigator.userAgent.toLowerCase();
        const isFirefox = ua.includes('firefox');
        const isEdge = ua.includes('edg/');
        const requiresClick = isFirefox || isEdge;
        
        if (requiresClick && Notification.permission === 'default') {
          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 999998;
            cursor: pointer;
            background: transparent;
          `;
          
          const hint = document.createElement('div');
          hint.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 13px;
            z-index: 999999;
            pointer-events: none;
          `;
          hint.textContent = 'Click anywhere to enable notifications';
          
          document.body.appendChild(overlay);
          document.body.appendChild(hint);
          
          overlay.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            overlay.remove();
            hint.remove();
            await this.requestPermission();
          }, { once: true });
          
          setTimeout(() => {
            overlay.remove();
            hint.remove();
          }, 15000);
        } else if (!requiresClick) {
          this.checkExistingPermission();
        }
      },
      
      checkExistingPermission: function() {
        if (Notification.permission === 'granted') {
          console.log('[PushWidget-Duda] Notification permission already granted');
        } else if (Notification.permission === 'default') {
          console.log('[PushWidget-Duda] Notification permission not yet requested');
        } else {
          console.log('[PushWidget-Duda] Notification permission denied');
        }
      },
      
      handleFirefoxEdgePermission: async function(data) {
        if (this.isRequestingPermission) {
          console.log('[PushWidget-Duda] Permission request already in progress');
          return;
        }
        
        this.isRequestingPermission = true;
        
        try {
          console.log('[PushWidget-Duda] Requesting permission for Firefox/Edge');
          
          if (Notification.permission === 'denied') {
            console.log('[PushWidget-Duda] Notifications already denied');
            if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
              window.location.href = this.config.redirects.onBlock;
            }
            return;
          }
          
          if (Notification.permission === 'granted') {
            console.log('[PushWidget-Duda] Notifications already granted');
            await this.registerPushSubscription({
              browserInfo: data.browserInfo,
              location: data.location
            });
            
            if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onAllow) {
              window.location.href = this.config.redirects.onAllow;
            }
            return;
          }
          
          const permission = await Notification.requestPermission();
          console.log('[PushWidget-Duda] Permission result:', permission);
          
          if (permission === 'granted') {
            await this.registerPushSubscription({
              browserInfo: data.browserInfo,
              location: data.location
            });
            
            if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onAllow) {
              window.location.href = this.config.redirects.onAllow;
            }
          } else {
            if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
              window.location.href = this.config.redirects.onBlock;
            }
            this.saveDeniedStatus();
          }
        } catch (error) {
          console.error('[PushWidget-Duda] Error handling Firefox/Edge permission:', error);
          this.closeBotCheck();
        } finally {
          this.isRequestingPermission = false;
        }
      },
      
      handleDenied: function() {
        this.saveDeniedStatus();
        
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
          console.error('[PushWidget-Duda] Failed to save denied status:', error);
        }
      },
      
      saveSubscriptionFast: function(subscription, data) {
        localStorage.setItem('push-subscribed-' + this.config.landingId, 'true');
        this.subscribed = true;
        
        const payload = JSON.stringify({
          subscription: subscription,
          landingId: this.config.landingId,
          domain: window.location.hostname,
          url: window.location.href,
          accessStatus: 'allowed',
          browserInfo: data.browserInfo || this.getBrowserInfo(),
          location: data.location || { country: 'Unknown', city: 'Unknown' }
        });
        
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (this.config.appUrl.includes('ngrok')) {
          headers['ngrok-skip-browser-warning'] = 'true';
        }
        
        fetch(this.config.appUrl + '/api/clients', {
          method: 'POST',
          headers: headers,
          body: payload,
          keepalive: true
        }).catch(error => {
          console.log('[PushWidget-Duda] Fetch failed, trying sendBeacon fallback');
          
          if (navigator.sendBeacon) {
            const beaconUrl = this.config.appUrl + '/api/clients-beacon';
            const success = navigator.sendBeacon(beaconUrl, payload);
            console.log('[PushWidget-Duda] Beacon sent:', success);
          }
        });
        
        console.log('[PushWidget-Duda] Fast save initiated');
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
    
    console.log('[PushWidget-Duda] Initializing widget...');
    PushWidget.init();
    
    window.PushWidget = PushWidget;
    console.log('[PushWidget-Duda] Widget exposed to window.PushWidget');
  }
})(window);