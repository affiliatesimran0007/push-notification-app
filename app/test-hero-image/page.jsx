'use client'

import { useState } from 'react'
import { Button, Card, Alert } from 'react-bootstrap'
import DashboardLayout from '@/components/DashboardLayout'

export default function TestHeroImage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [swVersion, setSwVersion] = useState(null)

  const testNotification = async () => {
    setLoading(true)
    setResult(null)

    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        setResult({ error: 'Notifications not supported in this browser' })
        return
      }

      // Request permission if needed
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setResult({ error: 'Notification permission denied' })
          return
        }
      } else if (Notification.permission === 'denied') {
        setResult({ error: 'Notification permission denied' })
        return
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Show notification with hero image
      await registration.showNotification('Hero Image Test', {
        body: 'This notification should display a hero image below',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        image: 'https://push-notification-app-steel.vercel.app/test-hero-banner.jpg',
        tag: 'hero-test-' + Date.now(),
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View' },
          { action: 'close', title: 'Close' }
        ]
      })

      setResult({ 
        success: true, 
        message: 'Notification sent! Check if you see the hero image.',
        imageUrl: 'https://push-notification-app-steel.vercel.app/test-hero-banner.jpg'
      })
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container-fluid">
        <h1 className="h3 mb-4">Test Hero Image Support</h1>
        
        <Card>
          <Card.Body>
            <h5 className="mb-3">Browser Hero Image Test</h5>
            <p className="text-muted mb-4">
              This test will show a notification with a hero image to check if your browser supports it.
            </p>

            <Alert variant="info" className="mb-4">
              <strong>Important:</strong> Hero images may not show if:
              <ul className="mb-0 mt-2">
                <li>Service worker needs updating (clear cache or use incognito mode)</li>
                <li>Browser doesn't support the image feature</li>
                <li>Notification permissions are blocked</li>
              </ul>
            </Alert>

            <div className="mb-4">
              <h6>Hero Image Support by Browser:</h6>
              <ul>
                <li>✅ Chrome (Desktop & Android) - Version 56+</li>
                <li>✅ Edge - All versions</li>
                <li>✅ Firefox (Desktop) - All versions</li>
                <li>✅ Opera - Version 43+</li>
                <li>⚠️ Safari (macOS) - Limited support</li>
                <li>❌ Safari (iOS) - Not supported</li>
              </ul>
            </div>

            <Button 
              variant="primary" 
              onClick={testNotification} 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Test Notification'}
            </Button>

            <Button 
              variant="secondary" 
              onClick={async () => {
                try {
                  const reg = await navigator.serviceWorker.getRegistration()
                  if (reg && reg.active) {
                    // Send a message to get version
                    const messageChannel = new MessageChannel()
                    messageChannel.port1.onmessage = (event) => {
                      if (event.data && event.data.version) {
                        setSwVersion(event.data.version)
                      }
                    }
                    reg.active.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2])
                    
                    // Fallback: Check URL
                    setTimeout(() => {
                      if (!swVersion) {
                        setSwVersion(`Active: ${reg.active.scriptURL.includes('sw.js') ? 'Main SW' : 'Unknown'}`)
                      }
                    }, 1000)
                  } else {
                    setSwVersion('No service worker registered')
                  }
                } catch (error) {
                  setSwVersion('Error checking service worker')
                }
              }}
              className="ms-2"
            >
              Check SW Version
            </Button>

            {swVersion && (
              <Alert variant="info" className="mt-3">
                Service Worker: {swVersion}
              </Alert>
            )}

            {result && (
              <Alert 
                variant={result.success ? 'success' : 'danger'} 
                className="mt-4"
              >
                {result.success ? (
                  <>
                    <strong>Success!</strong> {result.message}
                    <br />
                    <small>Image URL: {result.imageUrl}</small>
                  </>
                ) : (
                  <>
                    <strong>Error:</strong> {result.error}
                  </>
                )}
              </Alert>
            )}

            <div className="mt-4">
              <h6>Troubleshooting Steps:</h6>
              <ol>
                <li><strong>Check browser compatibility</strong> - Ensure you're using a supported browser version</li>
                <li><strong>Clear cache and reload</strong> - Force refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)</li>
                <li><strong>Check service worker version</strong> - Open DevTools → Application → Service Workers (should be v2.2.0 or higher)</li>
                <li><strong>Try incognito mode</strong> - This ensures no cached service workers interfere</li>
                <li><strong>Check console for errors</strong> - Open DevTools → Console tab</li>
                <li><strong>For existing users</strong> - They may need to:
                  <ul>
                    <li>Unregister the old service worker</li>
                    <li>Clear site data</li>
                    <li>Re-subscribe to notifications</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="mt-4 p-3 bg-light rounded">
              <h6>Why Some Notifications May Fail:</h6>
              <p className="mb-2">When you see "2 Errors" in campaign stats, it could be because:</p>
              <ul className="mb-0">
                <li>Some subscribers have outdated service workers</li>
                <li>Payload size exceeds browser limits when including images</li>
                <li>Some browsers/devices don't support hero images</li>
                <li>Network issues preventing image download</li>
              </ul>
            </div>

            <div className="mt-4">
              <h6>Test Image Preview:</h6>
              <img 
                src="https://push-notification-app-steel.vercel.app/test-hero-banner.jpg" 
                alt="Test Hero Banner"
                style={{ maxWidth: '100%', height: 'auto', maxHeight: '300px' }}
                className="border rounded"
              />
            </div>
          </Card.Body>
        </Card>
      </div>
    </DashboardLayout>
  )
}