'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SubscribePage() {
  const { landingId } = useParams();
  const router = useRouter();
  const [landing, setLanding] = useState(null);
  const [status, setStatus] = useState('loading');
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Check if already subscribed
    const subscriptionKey = `push-subscribed-${landingId}`;
    if (localStorage.getItem(subscriptionKey) === 'true') {
      setStatus('already-subscribed');
      return;
    }

    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Fetch landing page details
    fetchLandingDetails();
  }, [landingId]);

  const fetchLandingDetails = async () => {
    try {
      const response = await fetch(`/api/landing?id=${landingId}`);
      if (!response.ok) throw new Error('Landing page not found');
      
      const data = await response.json();
      setLanding(data);
      setStatus('ready');
    } catch (error) {
      console.error('Error fetching landing:', error);
      setStatus('error');
    }
  };

  const handleSubscribe = async () => {
    setStatus('subscribing');

    try {
      // Check browser support
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications not supported');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        setStatus('denied');
        // Redirect to block URL if configured
        if (landing?.redirectOnBlock) {
          setTimeout(() => {
            window.location.href = landing.redirectOnBlock;
          }, 2000);
        }
        return;
      }

      // Register service worker on our domain
      const registration = await navigator.serviceWorker.register('/subscribe-sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidResponse = await fetch('/api/vapid/generate');
      const { publicKey } = await vapidResponse.json();

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Get browser info
      const browserInfo = getBrowserInfo();

      // Send subscription to server
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          landingId,
          domain: landing?.domain || window.location.hostname,
          url: window.location.href,
          browserInfo,
          location: { country: 'Unknown', city: 'Unknown' }
        })
      });

      if (!response.ok) throw new Error('Failed to save subscription');

      // Mark as subscribed
      localStorage.setItem(`push-subscribed-${landingId}`, 'true');
      setStatus('success');

      // Notify parent window if in iframe/popup
      if (window.opener || window.parent !== window) {
        window.postMessage({
          type: 'subscription-complete',
          landingId,
          status: 'success'
        }, '*');
      }

      // Redirect to success URL if configured
      if (landing?.redirectOnAllow) {
        setTimeout(() => {
          window.location.href = landing.redirectOnAllow;
        }, 2000);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setStatus('error');
    }
  };

  const getBrowserInfo = () => {
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
  };

  const urlBase64ToUint8Array = (base64String) => {
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
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600">We couldn't set up notifications. Please try again later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Already subscribed
  if (status === 'already-subscribed') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're already subscribed!</h2>
          <p className="text-gray-600">You're all set to receive notifications from {landing?.name}.</p>
          <button 
            onClick={() => window.close()}
            className="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully subscribed!</h2>
          <p className="text-gray-600">You'll now receive notifications from {landing?.name}.</p>
          {landing?.redirectOnAllow && (
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          )}
        </div>
      </div>
    );
  }

  // Denied state
  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-yellow-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications blocked</h2>
          <p className="text-gray-600">You've chosen not to receive notifications. You can enable them later in your browser settings.</p>
          {landing?.redirectOnBlock && (
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          )}
        </div>
      </div>
    );
  }

  // Subscribing state
  if (status === 'subscribing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setting up notifications...</h2>
          <p className="text-gray-600">Please allow notifications when prompted.</p>
        </div>
      </div>
    );
  }

  // Main subscription page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">{landing?.name || 'Push Notifications'}</h1>
          <p className="text-blue-100">Stay updated with instant notifications</p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Permission status */}
          {permission === 'denied' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Notifications are blocked.</strong> Please enable them in your browser settings to continue.
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">What you'll get:</h2>
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Real-time updates</p>
                <p className="text-sm text-gray-600">Get notified instantly when something important happens</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Customizable alerts</p>
                <p className="text-sm text-gray-600">Only receive the notifications that matter to you</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Easy to manage</p>
                <p className="text-sm text-gray-600">Unsubscribe anytime with just one click</p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleSubscribe}
            disabled={permission === 'denied'}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enable Notifications
          </button>

          {/* Privacy note */}
          <p className="mt-6 text-center text-xs text-gray-500">
            We respect your privacy. Your data is secure and you can unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}