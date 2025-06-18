// Notification Diagnostic Tool
// This script helps diagnose issues with push notifications

(function() {
  console.log('=== Push Notification Diagnostics ===');
  console.log('Starting diagnostic tests...\n');

  // Test 1: Check notification support
  if (!('Notification' in window)) {
    console.error('❌ Test 1 FAILED: Notifications are not supported in this browser');
    return;
  }
  console.log('✅ Test 1 PASSED: Notifications are supported');

  // Test 2: Check service worker support
  if (!('serviceWorker' in navigator)) {
    console.error('❌ Test 2 FAILED: Service Workers are not supported in this browser');
    return;
  }
  console.log('✅ Test 2 PASSED: Service Workers are supported');

  // Test 3: Check push support
  if (!('PushManager' in window)) {
    console.error('❌ Test 3 FAILED: Push API is not supported in this browser');
    return;
  }
  console.log('✅ Test 3 PASSED: Push API is supported');

  // Test 4: Check notification permission
  console.log(`📋 Test 4: Notification permission is: ${Notification.permission}`);
  if (Notification.permission === 'denied') {
    console.warn('⚠️  Notifications are blocked. Please enable them in browser settings.');
  }

  // Test 5: Check service worker registration
  navigator.serviceWorker.getRegistration().then(function(registration) {
    if (!registration) {
      console.error('❌ Test 5 FAILED: No service worker is registered');
      return;
    }
    console.log('✅ Test 5 PASSED: Service worker is registered');
    console.log('   Service Worker URL:', registration.active?.scriptURL);
    
    // Test 6: Check push subscription
    registration.pushManager.getSubscription().then(function(subscription) {
      if (!subscription) {
        console.warn('⚠️  Test 6: No push subscription found');
        return;
      }
      console.log('✅ Test 6 PASSED: Push subscription exists');
      console.log('   Endpoint:', subscription.endpoint);
      console.log('   Keys:', {
        p256dh: subscription.toJSON().keys?.p256dh?.substring(0, 20) + '...',
        auth: subscription.toJSON().keys?.auth?.substring(0, 10) + '...'
      });
    });

    // Test 7: Check service worker version
    if (registration.active) {
      // Send a message to the service worker to get its version
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = function(event) {
        if (event.data && event.data.version) {
          console.log('✅ Test 7: Service Worker version:', event.data.version);
          if (event.data.version !== 'v2.2.0') {
            console.warn('⚠️  Service Worker may be outdated. Current:', event.data.version, 'Expected: v2.2.0');
            console.log('   Try clearing cache or unregistering and re-registering the service worker');
          }
        }
      };
      registration.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2]);
    }
  });

  // Test 8: Browser feature detection for notification images
  console.log('\n📱 Browser Feature Support:');
  
  // Check if browser supports notification images
  if ('Notification' in window && Notification.prototype.hasOwnProperty('image')) {
    console.log('✅ Hero images (notification.image) are supported');
  } else {
    console.warn('❌ Hero images (notification.image) are NOT supported in this browser');
  }

  // Check browser and version
  const userAgent = navigator.userAgent;
  let browserInfo = 'Unknown';
  
  if (userAgent.includes('Chrome')) {
    const chromeVersion = userAgent.match(/Chrome\/(\d+)/);
    browserInfo = `Chrome ${chromeVersion ? chromeVersion[1] : 'Unknown'}`;
    if (chromeVersion && parseInt(chromeVersion[1]) >= 56) {
      console.log(`✅ ${browserInfo} supports hero images`);
    } else {
      console.warn(`⚠️  ${browserInfo} may not support hero images (requires Chrome 56+)`);
    }
  } else if (userAgent.includes('Firefox')) {
    const firefoxVersion = userAgent.match(/Firefox\/(\d+)/);
    browserInfo = `Firefox ${firefoxVersion ? firefoxVersion[1] : 'Unknown'}`;
    console.log(`✅ ${browserInfo} supports hero images`);
  } else if (userAgent.includes('Edge')) {
    const edgeVersion = userAgent.match(/Edge\/(\d+)/);
    browserInfo = `Edge ${edgeVersion ? edgeVersion[1] : 'Unknown'}`;
    console.log(`✅ ${browserInfo} supports hero images`);
  } else if (userAgent.includes('Safari')) {
    const safariVersion = userAgent.match(/Version\/(\d+)/);
    browserInfo = `Safari ${safariVersion ? safariVersion[1] : 'Unknown'}`;
    console.warn(`⚠️  ${browserInfo} has limited support for hero images`);
  }

  console.log('   Detected browser:', browserInfo);
  console.log('   User Agent:', userAgent);

  // Test 9: Image loading test
  console.log('\n🖼️  Testing image loading...');
  const testImageUrl = 'https://push-notification-app-steel.vercel.app/test-hero-banner.jpg';
  const img = new Image();
  img.onload = function() {
    console.log('✅ Test image loaded successfully');
    console.log('   Image dimensions:', img.width + 'x' + img.height);
    console.log('   Image URL:', testImageUrl);
  };
  img.onerror = function() {
    console.error('❌ Failed to load test image');
    console.log('   Image URL:', testImageUrl);
  };
  img.src = testImageUrl;

  console.log('\n=== End of Diagnostics ===');
  console.log('To test a notification with hero image, run: testHeroNotification()');

  // Add test function to window
  window.testHeroNotification = async function() {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Hero Image Test', {
        body: 'This notification should show a hero image below',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        image: 'https://push-notification-app-steel.vercel.app/test-hero-banner.jpg',
        tag: 'hero-test-' + Date.now(),
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View' },
          { action: 'close', title: 'Close' }
        ]
      });
      console.log('✅ Test notification sent! Check if you see the hero image.');
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
    }
  };
})();