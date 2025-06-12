'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function EmbedPage() {
  const { landingId } = useParams();
  const [landing, setLanding] = useState(null);
  const [status, setStatus] = useState('loading');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Check if already subscribed
    const subscriptionKey = `push-subscribed-${landingId}`;
    if (localStorage.getItem(subscriptionKey) === 'true') {
      setSubscribed(true);
      setStatus('subscribed');
      return;
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

  const handleSubscribe = () => {
    // Open subscription in parent window
    window.open(
      `/subscribe/${landingId}`,
      '_blank',
      'width=500,height=600,toolbar=no,menubar=no'
    );
    
    // Listen for completion
    window.addEventListener('message', (event) => {
      if (event.data.type === 'subscription-complete' && event.data.landingId === landingId) {
        localStorage.setItem(`push-subscribed-${landingId}`, 'true');
        setSubscribed(true);
        setStatus('subscribed');
      }
    });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[300px] bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[300px] bg-red-50">
        <div className="text-center text-red-600">
          <p className="text-xl">⚠️ Invalid configuration</p>
          <p className="mt-2 text-sm">Please check your landing ID</p>
        </div>
      </div>
    );
  }

  if (status === 'subscribed') {
    return (
      <div className="flex items-center justify-center min-h-[300px] bg-green-50">
        <div className="text-center text-green-600">
          <p className="text-2xl">✓ You're subscribed!</p>
          <p className="mt-2 text-sm">You'll receive notifications from {landing?.name || 'this site'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[300px] bg-white p-8">
      <div className="max-w-md mx-auto text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Stay Updated
        </h2>
        <p className="text-gray-600 mb-6">
          Get instant notifications from {landing?.name || 'this website'} for important updates and announcements.
        </p>

        {/* Benefits */}
        <div className="text-left mb-6 space-y-2">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">Instant alerts for important updates</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">Never miss critical information</span>
          </div>
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-gray-700">Easy to unsubscribe anytime</span>
          </div>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
        >
          Enable Notifications
        </button>

        {/* Privacy Note */}
        <p className="mt-4 text-xs text-gray-500">
          We respect your privacy. No spam, ever.
        </p>
      </div>
    </div>
  );
}