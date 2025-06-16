// Enhanced Notification Debugger for Console
// Detects OS/Browser blocking issues

(function() {
  'use strict';
  
  console.log('%c🔍 Notification Debugger Active', 'background: #2196F3; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold');
  
  const NotificationDebugger = {
    startTime: Date.now(),
    logs: [],
    
    async runDiagnostics() {
      console.group('📋 Notification System Diagnostics');
      
      // 1. Check browser support
      this.checkBrowserSupport();
      
      // 2. Check permissions
      await this.checkPermissions();
      
      // 3. Check service worker
      await this.checkServiceWorker();
      
      // 4. Check Chrome policies
      this.checkChromePolicies();
      
      // 5. Test notification visibility
      await this.testNotificationVisibility();
      
      // 6. Check for common issues
      this.checkCommonIssues();
      
      console.groupEnd();
      
      // Show summary
      this.showSummary();
    },
    
    checkBrowserSupport() {
      console.group('🌐 Browser Support');
      
      const support = {
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        notification: 'Notification' in window,
        https: location.protocol === 'https:' || location.hostname === 'localhost'
      };
      
      Object.entries(support).forEach(([feature, supported]) => {
        console.log(`${supported ? '✅' : '❌'} ${feature}: ${supported}`);
      });
      
      // Browser detection
      const ua = navigator.userAgent;
      const browser = {
        chrome: /Chrome\/(\d+)/.test(ua) && !/Edge/.test(ua),
        edge: /Edge\/(\d+)/.test(ua),
        firefox: /Firefox\/(\d+)/.test(ua),
        safari: /Safari\/(\d+)/.test(ua) && !/Chrome/.test(ua)
      };
      
      const browserName = Object.keys(browser).find(b => browser[b]) || 'Unknown';
      console.log(`📱 Browser: ${browserName}`);
      console.log(`📱 User Agent: ${ua}`);
      
      console.groupEnd();
      return support;
    },
    
    async checkPermissions() {
      console.group('🔐 Notification Permissions');
      
      const permission = Notification.permission;
      const icon = permission === 'granted' ? '✅' : permission === 'denied' ? '❌' : '⏳';
      
      console.log(`${icon} Current permission: ${permission}`);
      
      if (permission === 'denied') {
        console.warn('⚠️ Notifications are BLOCKED in browser settings');
        console.log('Fix: Click the lock icon in address bar → Notifications → Allow');
      } else if (permission === 'default') {
        console.log('💡 Permission not yet requested');
      }
      
      // Check if we can request permission
      if (permission === 'default') {
        console.log('🔄 Can request permission: Yes');
      }
      
      console.groupEnd();
      return permission;
    },
    
    async checkServiceWorker() {
      console.group('⚙️ Service Worker Status');
      
      if (!('serviceWorker' in navigator)) {
        console.error('❌ Service Workers not supported');
        console.groupEnd();
        return;
      }
      
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`📊 Active registrations: ${registrations.length}`);
      
      for (const reg of registrations) {
        console.group(`📍 ${reg.scope}`);
        console.log(`State: ${reg.active ? '✅ Active' : '⏳ Not Active'}`);
        
        if (reg.active) {
          // Check push subscription
          try {
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              console.log('✅ Push subscription exists');
              console.log(`Endpoint: ${sub.endpoint.substring(0, 50)}...`);
              const provider = sub.endpoint.includes('fcm.googleapis.com') ? 'FCM' :
                             sub.endpoint.includes('mozilla.com') ? 'Mozilla' :
                             sub.endpoint.includes('windows.com') ? 'WNS' : 'Unknown';
              console.log(`Provider: ${provider}`);
            } else {
              console.warn('⚠️ No push subscription');
            }
          } catch (e) {
            console.error('Error checking subscription:', e);
          }
        }
        
        console.groupEnd();
      }
      
      console.groupEnd();
    },
    
    checkChromePolicies() {
      console.group('🏢 Chrome Policies & Flags');
      
      // We can't directly access chrome://policy, but we can check for signs
      console.log('💡 To check Chrome policies:');
      console.log('1. Open new tab and go to: chrome://policy');
      console.log('2. Look for notification-related policies');
      console.log('3. Common blocking policies:');
      console.log('   - DefaultNotificationsSetting');
      console.log('   - NotificationsAllowedForUrls');
      console.log('   - NotificationsBlockedForUrls');
      
      // Check if in incognito
      if (navigator.userAgent.includes('(Incognito)')) {
        console.warn('⚠️ Incognito mode detected - notifications may be limited');
      }
      
      console.groupEnd();
    },
    
    async testNotificationVisibility() {
      console.group('🧪 Testing Notification Visibility');
      
      if (Notification.permission !== 'granted') {
        console.warn('⏭️ Skipping - permission not granted');
        console.groupEnd();
        return;
      }
      
      const reg = await navigator.serviceWorker.ready;
      const testId = 'debug-test-' + Date.now();
      
      try {
        console.log('📤 Creating test notification...');
        await reg.showNotification('Debug Test', {
          body: 'Testing visibility at ' + new Date().toLocaleTimeString(),
          tag: testId,
          requireInteraction: false,
          icon: '/icon-192x192.png'
        });
        
        // Wait for notification to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if visible
        const notifications = await reg.getNotifications({ tag: testId });
        
        if (notifications.length > 0) {
          console.log('✅ Notification created and visible in API');
          console.log('👁️ Check if you can see the notification popup');
          
          // Clean up
          notifications.forEach(n => n.close());
        } else {
          console.error('❌ Notification not found - OS/Browser is blocking!');
          console.log('');
          console.log('🚨 NOTIFICATION BLOCKING DETECTED! 🚨');
          console.log('');
          console.log('Common causes:');
          console.log('1. Windows Focus Assist is ON');
          console.log('   Fix: Settings → System → Focus assist → Turn OFF');
          console.log('');
          console.log('2. Do Not Disturb mode is active');
          console.log('   Fix: Check system tray for moon icon');
          console.log('');
          console.log('3. Chrome blocked in Windows Settings');
          console.log('   Fix: Settings → System → Notifications → Allow Chrome');
          console.log('');
          console.log('4. Browser profile restrictions');
          console.log('   Fix: Try in a different Chrome profile');
        }
      } catch (e) {
        console.error('❌ Failed to create notification:', e);
      }
      
      console.groupEnd();
    },
    
    checkCommonIssues() {
      console.group('⚠️ Common Issues Check');
      
      // Check timezone for scheduling issues
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log(`🕐 Timezone: ${tz}`);
      
      // Check online status
      console.log(`🌐 Online: ${navigator.onLine ? 'Yes' : 'No'}`);
      
      // Check memory
      if (navigator.deviceMemory) {
        console.log(`💾 Device Memory: ${navigator.deviceMemory}GB`);
      }
      
      // Battery status (if available)
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          console.log(`🔋 Battery: ${Math.round(battery.level * 100)}%`);
          if (battery.level < 0.15) {
            console.warn('⚠️ Low battery may affect notifications');
          }
        });
      }
      
      console.groupEnd();
    },
    
    showSummary() {
      console.group('📊 Diagnostic Summary');
      
      console.log('%cTo manually check Windows Focus Assist:', 'font-weight: bold; color: #2196F3');
      console.log('1. Press Win + A to open Action Center');
      console.log('2. Look for Focus Assist tile');
      console.log('3. Should show "Off" - if not, click to turn off');
      console.log('');
      
      console.log('%cTo check Chrome notification settings:', 'font-weight: bold; color: #2196F3');
      console.log('1. Copy and paste this URL: chrome://settings/content/notifications');
      console.log('2. Check if', window.location.hostname, 'is in the allowed list');
      console.log('');
      
      console.log('%cTo check Windows notification settings:', 'font-weight: bold; color: #2196F3');
      console.log('1. Open Windows Settings (Win + I)');
      console.log('2. Go to System → Notifications');
      console.log('3. Find Google Chrome in the app list');
      console.log('4. Make sure it\'s turned ON');
      console.log('5. Click on Chrome and ensure "Show notification banners" is ON');
      
      console.groupEnd();
    },
    
    // Monitor notification events
    monitorNotifications() {
      console.log('%c👀 Monitoring notification events...', 'background: #4CAF50; color: white; padding: 3px 8px; border-radius: 3px');
      
      // Override showNotification to log calls
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          const originalShow = reg.showNotification;
          reg.showNotification = async function(...args) {
            console.group('🔔 showNotification called');
            console.log('Title:', args[0]);
            console.log('Options:', args[1]);
            console.log('Time:', new Date().toISOString());
            console.groupEnd();
            
            return originalShow.apply(this, args);
          };
        });
      }
    }
  };
  
  // Auto-run diagnostics
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      NotificationDebugger.runDiagnostics();
      NotificationDebugger.monitorNotifications();
    });
  } else {
    NotificationDebugger.runDiagnostics();
    NotificationDebugger.monitorNotifications();
  }
  
  // Make available globally
  window.NotificationDebugger = NotificationDebugger;
  
  // Add console command
  console.log('💡 Run %cNotificationDebugger.runDiagnostics()%c anytime to re-run diagnostics', 'background: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-family: monospace', '');
})();