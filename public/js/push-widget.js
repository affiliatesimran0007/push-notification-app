// Push Notification Widget for Customer Websites
// This file is loaded from YOUR domain onto CUSTOMER domains

(function(window) {
  'use strict';
  
  console.log('[PushWidget] Script loaded, checking for PUSH_CONFIG...');
  
  // Auto-initialize if PUSH_CONFIG exists
  if (window.PUSH_CONFIG) {
    console.log('[PushWidget] PUSH_CONFIG found:', window.PUSH_CONFIG);
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      // If DOM is still loading, wait for it
      document.addEventListener('DOMContentLoaded', function() {
        initWidget(window.PUSH_CONFIG);
      });
    } else {
      // DOM already loaded, initialize now
      initWidget(window.PUSH_CONFIG);
    }
  }
  
  function initWidget(config) {
    console.log('[PushWidget] initWidget called with config:', config);
    
    // If widget already exists, reinitialize with new config
    if (window.PushWidget) {
      console.log('[PushWidget] Widget already exists, reinitializing...');
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
      
      // Check if already subscribed locally - but don't skip bot check
      const subscriptionKey = 'push-subscribed-' + config.landingId;
      if (localStorage.getItem(subscriptionKey) === 'true') {
        console.log('[PushWidget] Already subscribed');
        this.subscribed = true;
        // Don't return here - let bot check still show if enabled
      }
      
      // IMMEDIATELY show overlay if bot protection is enabled
      // This prevents the landing page background from flashing
      if (this.config.botProtection || this.config.botCheck !== false) {
        console.log('[PushWidget] Bot protection enabled, checking environment...');
        // Check if we're in a test environment or iframe
        if (window.parent === window) {
          console.log('[PushWidget] Not in iframe, showing bot check overlay');
          this.showBotCheckOverlay();
          this.overlayShown = true;
          // IMPORTANT: Return here to prevent any further processing
          // The bot check will handle everything via message events
          return;
        } else {
          console.log('[PushWidget] In iframe, skipping overlay');
          return; // Also return here to prevent further processing
        }
      } else {
        console.log('[PushWidget] Bot protection disabled');
      }
      
      // Check browser support with detailed compatibility
      if (!this.checkBrowserCompatibility()) {
        return;
      }
      
      // Only continue if bot protection is explicitly disabled
      if (!this.config.botProtection && this.config.botCheck === false) {
        // Check if already has push subscription
        this.checkExistingSubscription().then(hasSubscription => {
          console.log('[PushWidget] Existing subscription check:', hasSubscription);
          if (hasSubscription) {
            console.log('[PushWidget] Found existing subscription');
            localStorage.setItem(subscriptionKey, 'true');
            this.subscribed = true;
            return;
          }
          
          // Check if we're in a test environment or iframe
          if (window.parent !== window) {
            console.log('Widget loaded in iframe, skipping auto-init');
            return;
          }
          
          // Use browser-aware approach
          this.initializeWithBrowserCheck();
        });
      }
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
      // Wait for body to exist
      if (!document.body) {
        console.warn('[PushWidget] Body not ready, waiting...');
        setTimeout(() => this.showBotCheckOverlay(), 50);
        return;
      }
      
      // Hide the page content immediately to prevent flash
      document.body.style.visibility = 'hidden';
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      
      // Create full page white overlay
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
        z-index: 2147483647;
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
      
      // Debug iframe
      console.log('[PushWidget] Bot check iframe URL:', iframe.src);
      
      // Append iframe to overlay
      overlay.appendChild(iframe);
      
      // Debug logging
      console.log('[PushWidget] Appending overlay to body...');
      document.body.appendChild(overlay);
      console.log('[PushWidget] Overlay appended successfully');
      
      // Verify overlay exists
      const checkOverlay = document.getElementById('push-widget-overlay');
      console.log('[PushWidget] Overlay verification:', checkOverlay ? 'Found' : 'Not found');
      console.log('[PushWidget] Overlay styles:', checkOverlay ? checkOverlay.style.cssText : 'N/A');
      console.log('[PushWidget] Body visibility:', document.body.style.visibility);
      
      // Check iframe
      const checkIframe = document.getElementById('push-widget-iframe');
      console.log('[PushWidget] Iframe verification:', checkIframe ? 'Found' : 'Not found');
      console.log('[PushWidget] Iframe src:', checkIframe ? checkIframe.src : 'N/A');
      
      // Listen for messages from iframe
      window.addEventListener('message', this.handleMessage.bind(this));
    },
    
    redirectToBotCheck: function() {
      // Use overlay instead of redirect
      this.showBotCheckOverlay();
    },
    
    closeBotCheck: function() {
      const overlay = document.getElementById('push-widget-overlay');
      if (overlay) overlay.remove();
      
      // Restore body visibility and overflow
      if (document.body) {
        document.body.style.visibility = 'visible';
        document.body.style.overflow = ''; // Restore scrolling
      }
      
      window.removeEventListener('message', this.handleMessage.bind(this));
    },
      
      requestPermissionWithBotCheck: async function() {
      try {
        // DON'T close the bot check overlay - keep it open
        console.log('[PushWidget] Requesting permission while bot check remains visible');
        
        // Request permission on the main page
        const permission = await Notification.requestPermission();
        console.log('Permission result:', permission);
        
        // Process based on permission result
        if (permission === 'granted') {
          // Register subscription first, then redirect
          console.log('[PushWidget] Permission granted, registering subscription...');
          
          // Wait for registration to complete
          await this.registerPushSubscription(this.botCheckData || {
            browserInfo: this.getBrowserInfo(),
            location: { country: 'Unknown', city: 'Unknown' }
          });
          
          // Now redirect after registration is complete
          if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onAllow) {
            console.log('[PushWidget] Registration complete, redirecting to:', this.config.redirects.onAllow);
            window.location.href = this.config.redirects.onAllow;
          }
        } else if (permission === 'denied') {
          // Redirect immediately for denied
          if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
            console.log('[PushWidget] Permission denied, redirecting to:', this.config.redirects.onBlock);
            window.location.href = this.config.redirects.onBlock;
          }
          // Don't close overlay - let redirect happen first
          
          // Save denied status in background
          this.saveDeniedStatus();
        } else {
          // User dismissed - treat as denied
          if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
            console.log('[PushWidget] Permission dismissed, redirecting to:', this.config.redirects.onBlock);
            window.location.href = this.config.redirects.onBlock;
          }
          this.saveDeniedStatus();
        }
        
        // Clean up
        this.botCheckData = null;
        this.botCheckCompleted = false;
      } catch (error) {
        console.error('Error requesting permission:', error);
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
        console.error('Error requesting permission:', error);
      }
    },
    
    // New method to handle browser-specific requirements
    initializeWithBrowserCheck: function() {
      const ua = navigator.userAgent.toLowerCase();
      const isFirefox = ua.includes('firefox');
      const isEdge = ua.includes('edg/');
      const requiresClick = isFirefox || isEdge;
      
      if (requiresClick && Notification.permission === 'default') {
        // Create page-wide click listener for first interaction
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
          
          // Now we have user gesture
          await this.requestPermission();
        }, { once: true });
        
        // Remove after 15 seconds
        setTimeout(() => {
          overlay.remove();
          hint.remove();
        }, 15000);
      } else if (!requiresClick) {
        // Chrome/Safari - can auto-check
        this.checkExistingPermission();
      }
    },
    
    checkBrowserCompatibility: function() {
      const ua = navigator.userAgent;
      let isCompatible = true;
      let message = '';
      
      // Check basic API support
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
      
      // Browser-specific checks
      if (isCompatible) {
        // Safari iOS requires special handling
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
        
        // Firefox for Android has limited support
        if (ua.indexOf('Firefox') > -1 && ua.indexOf('Android') > -1) {
          console.warn('Firefox on Android has limited push notification support');
        }
      }
      
      if (!isCompatible) {
        console.warn('Browser compatibility issue:', message);
        // Optionally show user-friendly message
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
      
      // Opera detection (must be before Chrome as Opera includes Chrome in UA)
      if (ua.indexOf('OPR') > -1 || ua.indexOf('Opera') > -1) {
        browser = 'Opera';
        browserVersion = ua.match(/(?:OPR|Opera)[\s\/]([\d.]+)/)?.[1] || 'Unknown';
      }
      // Edge detection (Chromium-based)
      else if (ua.indexOf('Edg') > -1) {
        browser = 'Edge';
        browserVersion = ua.match(/Edg[e]?\/(\d+)/)?.[1] || 'Unknown';
      }
      // Samsung Internet
      else if (ua.indexOf('SamsungBrowser') > -1) {
        browser = 'Samsung';
        browserVersion = ua.match(/SamsungBrowser\/(\d+)/)?.[1] || 'Unknown';
      }
      // Chrome detection
      else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Safari') > -1) {
        browser = 'Chrome';
        browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
      }
      // Firefox detection
      else if (ua.indexOf('Firefox') > -1) {
        browser = 'Firefox';
        browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
      }
      // Safari detection (must be after Chrome check)
      else if (ua.indexOf('Safari') > -1) {
        browser = 'Safari';
        browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
      }
      // Brave detection (reports as Chrome, check for Brave object)
      if (window.brave && window.brave.isBrave) {
        browser = 'Brave';
      }
      
      const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
      const deviceType = isMobile ? 'Mobile' : 'Desktop';
      
      let os = 'Unknown';
      if (ua.indexOf('Windows NT 10.0') > -1) {
        // Check for Windows Server 2016/2019/2022
        if (ua.indexOf('Windows NT 10.0; Win64; x64') > -1 && !ua.indexOf('Mobile') > -1) {
          // Could be Windows 10, 11, or Server
          os = 'Windows 10+';
        } else {
          os = 'Windows 10';
        }
      } else if (ua.indexOf('Windows NT 11.0') > -1) {
        os = 'Windows 11';
      } else if (ua.indexOf('Windows') > -1) {
        os = 'Windows';
      } else if (ua.indexOf('Mac') > -1) {
        os = 'macOS';
      } else if (ua.indexOf('Linux') > -1) {
        os = 'Linux';
      } else if (ua.indexOf('Android') > -1) {
        os = 'Android';
      } else if (ua.indexOf('iOS') > -1) {
        os = 'iOS';
      }
      
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
        // Store bot check data
        this.botCheckData = event.data;
        this.botCheckCompleted = true;
        
        // Now request permission on the parent page
        this.requestPermissionWithBotCheck();
      } else if (event.data.type === 'bot-check-completed') {
        // Handle permission response from bot check page
        if (event.data.permission === 'granted') {
          // Permission was granted in iframe, close overlay
          this.closeBotCheck();
          // Subscription already handled by bot-check page
          console.log('Push notifications enabled successfully');
        } else if (event.data.permission === 'denied') {
          // Permission was denied
          this.closeBotCheck();
          console.log('Push notifications were blocked');
        }
      } else if (event.data.type === 'request-permission-firefox') {
        // Firefox/Edge in iframe needs permission requested from parent window
        console.log('Firefox/Edge permission request received from iframe');
        this.handleFirefoxEdgePermission(event.data);
      }
    },
    
    handleFirefoxEdgePermission: async function(data) {
      const self = this;
      
      // Prevent multiple simultaneous permission requests
      if (this.isRequestingPermission) {
        console.log('Permission request already in progress, skipping...');
        return;
      }
      
      this.isRequestingPermission = true;
      
      try {
        // Request permission in parent window (not iframe)
        console.log('Requesting permission in parent window for Firefox/Edge');
        console.log('Current permission status:', Notification.permission);
        
        // Only request if not already granted or denied
        if (Notification.permission === 'denied') {
          console.log('Notifications are already denied for this domain');
          // Don't close overlay - redirect immediately
          if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
            window.location.href = this.config.redirects.onBlock;
          }
          return;
        }
        
        if (Notification.permission === 'granted') {
          console.log('Notifications are already granted, registering...');
          
          // Register subscription first
          await this.registerPushSubscription({
            browserInfo: data.browserInfo,
            location: data.location
          });
          
          // Then redirect
          if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onAllow) {
            window.location.href = this.config.redirects.onAllow;
          }
          return;
        }
        
        console.log('About to request permission...');
        console.log('Notification API available:', 'Notification' in window);
        console.log('RequestPermission available:', typeof Notification.requestPermission);
        
        // Special handling for Edge
        const isEdge = /edg/i.test(navigator.userAgent);
        console.log('Is Edge browser:', isEdge);
        
        let permission;
        
        if (isEdge) {
          // Edge has issues with notification permissions - just close and redirect
          console.log('Edge detected - notifications may not work properly');
          self.closeBotCheck();
          
          // Just redirect Edge users
          if (self.config.redirects && self.config.redirects.enabled && self.config.redirects.onBlock) {
            window.location.href = self.config.redirects.onBlock;
          }
          return;
        } else {
          // Original flow for Firefox
          const requestPermission = () => {
            return new Promise((resolve) => {
              try {
                const permissionPromise = Notification.requestPermission();
                
                if (permissionPromise && typeof permissionPromise.then === 'function') {
                  permissionPromise
                    .then(permission => {
                      console.log('Permission result (promise):', permission);
                      resolve(permission);
                    })
                    .catch(err => {
                      console.error('Permission error:', err);
                      resolve('default');
                    });
                } else {
                  console.log('Permission result (direct):', permissionPromise);
                  resolve(permissionPromise);
                }
              } catch (error) {
                console.log('Using callback-based permission request');
                Notification.requestPermission((permission) => {
                  console.log('Permission result (callback):', permission);
                  resolve(permission);
                });
              }
            });
          };
          
          permission = await requestPermission();
        }
        
        console.log('Final permission result:', permission);
        
        if (permission === 'granted') {
          // Register subscription first, then redirect
          console.log('[PushWidget] Firefox/Edge permission granted, registering subscription...');
          
          // Wait for registration to complete
          await self.registerPushSubscription({
            browserInfo: data.browserInfo,
            location: data.location
          });
          
          // Now redirect after registration is complete
          if (self.config.redirects && self.config.redirects.enabled && self.config.redirects.onAllow) {
            console.log('[PushWidget] Registration complete, redirecting to:', self.config.redirects.onAllow);
            window.location.href = self.config.redirects.onAllow;
          }
        } else {
          // Permission denied or dismissed - redirect immediately
          console.log('Permission denied or dismissed by user');
          
          if (self.config.redirects && self.config.redirects.enabled && self.config.redirects.onBlock) {
            console.log('[PushWidget] Firefox/Edge permission denied, redirecting to:', self.config.redirects.onBlock);
            window.location.href = self.config.redirects.onBlock;
          }
          
          // Save denied status in background
          self.saveDeniedStatus();
        }
      } catch (error) {
        console.error('Error handling Firefox/Edge permission:', error);
        self.closeBotCheck();
      } finally {
        this.isRequestingPermission = false;
      }
    },
    
    registerPushSubscription: async function(data) {
      try {
        // First check if service worker is available on this domain
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.warn('Push notifications not supported on this domain');
          
          // Don't save fake subscriptions - just log and redirect
          console.warn('Push notifications not supported, skipping registration');
          
          // Handle redirect
          if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onAllow) {
            window.location.href = this.config.redirects.onAllow;
          }
          
          return;
        }
        
        // Skip service worker check - let registration fail naturally if not found
        console.log('Attempting service worker registration...');
        
        // Register service worker on customer's domain
        console.log('\n=== PUSH WIDGET REGISTRATION DEBUG ===');
        console.log('Browser:', navigator.userAgent);
        console.log('Domain:', window.location.hostname);
        console.log('Protocol:', window.location.protocol);
        console.log('Service Worker support:', 'serviceWorker' in navigator);
        console.log('Push API support:', 'PushManager' in window);
        console.log('Notification API support:', 'Notification' in window);
        console.log('Notification permission:', Notification.permission);
        
        console.log('Registering service worker at /push-sw.js...');
        const registration = await navigator.serviceWorker.register('/push-sw.js', {
          updateViaCache: 'none' // Ensure fresh service worker in all Chrome versions
        });
        
        // Check for updates immediately
        registration.update().catch(err => console.log('SW update check failed:', err));
        
        // Wait for service worker to be ready
        console.log('Waiting for service worker to be ready...');
        await navigator.serviceWorker.ready;
        console.log('Service worker state:', registration.active ? 'active' : 'not active');
        console.log('Service worker scope:', registration.scope);
        
        // Wait a bit more to ensure it's fully activated
        console.log('Additional wait for activation...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay for older Chrome
        
        // Check for existing subscription first
        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          // Subscribe to push with browser-compatible options
          console.log('Creating new subscription...');
          const browserInfo = this.getBrowserInfo();
          console.log('Browser detected:', browserInfo.browser, browserInfo.version);
          
          const subscribeOptions = {
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(this.config.vapidKey)
          };
          
          // Browser-specific adjustments
          if (browserInfo.browser === 'Firefox') {
            // Firefox specific handling
            console.log('Applying Firefox-specific settings');
          } else if (browserInfo.browser === 'Safari') {
            // Safari specific handling
            console.log('Applying Safari-specific settings');
            // Safari doesn't support applicationServerKey in older versions
            if (parseInt(browserInfo.version) < 16) {
              delete subscribeOptions.applicationServerKey;
            }
          } else if (browserInfo.browser === 'Edge' || browserInfo.browser === 'Opera') {
            // Edge and Opera use Chromium engine
            console.log('Using Chromium-based settings for', browserInfo.browser);
          }
          
          console.log('Subscribe options:', subscribeOptions);
          
          try {
            console.log('Attempting to subscribe with options:', {
              userVisibleOnly: subscribeOptions.userVisibleOnly,
              hasApplicationServerKey: !!subscribeOptions.applicationServerKey,
              vapidKeyLength: this.config.vapidKey?.length
            });
            
            subscription = await registration.pushManager.subscribe(subscribeOptions);
            
            console.log('Subscription successful!');
            console.log('Subscription endpoint:', subscription.endpoint);
            console.log('Subscription keys present:', {
              p256dh: !!subscription.toJSON().keys?.p256dh,
              auth: !!subscription.toJSON().keys?.auth
            });
          } catch (subscribeError) {
            console.error('Subscribe error:', subscribeError.name, subscribeError.message);
            
            // VAPID keys are required - do not fallback to non-VAPID subscriptions
            throw subscribeError;
          }
        } else {
          console.log('Using existing subscription');
          console.log('Existing endpoint:', subscription.endpoint);
        }
        
        console.log('=== END REGISTRATION DEBUG ===\n');
        
        // Load advanced notification debugger
        if (!window.NotificationDebugger) {
          console.log('📊 Loading advanced notification debugger...');
          const debugScript = document.createElement('script');
          debugScript.src = this.config.appUrl + '/js/notification-debugger.js';
          debugScript.async = true;
          document.head.appendChild(debugScript);
        }
        
        // Ensure service worker is controlling the page
        if (registration.active) {
          console.log('Service worker is active and ready to receive notifications');
          
          // Test if notifications are actually visible (to detect OS blocking)
          try {
            console.log('Testing notification visibility...');
            const testTitle = 'Welcome! 🎉';
            await registration.showNotification(testTitle, {
              body: 'Push notifications are working correctly',
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              tag: 'visibility-test',
              requireInteraction: false
            });
            
            // Check if notification appears
            await new Promise(resolve => setTimeout(resolve, 1000));
            const visibleNotifications = await registration.getNotifications();
            const testNotif = visibleNotifications.find(n => n.title === testTitle);
            
            if (!testNotif) {
              console.warn('⚠️ Notifications may be blocked by system settings');
              
              // Only show warning if not in bot check flow
              if (!this.botCheckData) {
                const showWarning = confirm(
                  '⚠️ Push notifications are enabled but may not appear as popups.\n\n' +
                  'Common causes:\n' +
                  '• Windows Focus Assist is ON\n' +
                  '• Do Not Disturb mode is active\n' +
                  '• Chrome is blocked in Windows Settings\n\n' +
                  'Notifications will still arrive in your Action Center.\n\n' +
                  'Would you like tips on fixing this?'
                );
                
                if (showWarning) {
                  window.open('https://support.google.com/chrome/answer/3220216', '_blank');
                }
              }
            } else {
              console.log('✅ Notifications are visible');
              // Close test notification
              setTimeout(() => testNotif.close(), 3000);
            }
          } catch (err) {
            console.error('Visibility test error:', err);
          }
        }
        
        // Save to server
        await this.saveSubscriptionToServer(subscription.toJSON(), data);
        
      } catch (error) {
        console.error('Failed to subscribe:', error);
        alert('Failed to subscribe to push notifications. Error: ' + error.message);
        
        // Don't save fake subscriptions on error
        // Just handle redirect if needed
        if (this.config.redirects && this.config.redirects.enabled && this.config.redirects.onBlock) {
          window.location.href = this.config.redirects.onBlock;
        }
      }
    },
    
    saveSubscriptionToServer: async function(subscription, data) {
      try {
        // Prevent duplicate saves
        if (this.savingSubscription) {
          console.log('Already saving subscription, skipping duplicate');
          return;
        }
        this.savingSubscription = true;
        
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
          console.log('[PushWidget] Subscription saved successfully');
          
          // Don't redirect here - let the calling function handle redirects
        }
      } catch (error) {
        console.error('Failed to save subscription:', error);
      } finally {
        this.savingSubscription = false;
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
    console.log('[PushWidget] Initializing widget...');
    PushWidget.init();
    
    // Expose for debugging
    window.PushWidget = PushWidget;
    console.log('[PushWidget] Widget exposed to window.PushWidget');
  }
})(window);