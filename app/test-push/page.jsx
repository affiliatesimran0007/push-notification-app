'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Alert, Badge } from 'react-bootstrap'
import DashboardLayout from '@/components/DashboardLayout'
import { FiBell, FiCheck, FiX, FiInfo } from 'react-icons/fi'

export default function TestPushPage() {
  const [permission, setPermission] = useState('default')
  const [subscription, setSubscription] = useState(null)
  const [swRegistration, setSwRegistration] = useState(null)
  const [testStatus, setTestStatus] = useState('')
  const [testError, setTestError] = useState('')

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Check service worker
    checkServiceWorker()
  }, [])

  const checkServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        setSwRegistration(registration)
        
        if (registration) {
          const sub = await registration.pushManager.getSubscription()
          setSubscription(sub)
        }
      } catch (error) {
        console.error('Error checking service worker:', error)
      }
    }
  }

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        await registerServiceWorker()
      }
    } catch (error) {
      setTestError('Failed to request permission: ' + error.message)
    }
  }

  const registerServiceWorker = async () => {
    try {
      setTestStatus('Registering service worker...')
      
      // For Chrome/Brave, ensure we're using the correct scope
      const registration = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/'
      })
      
      setTestStatus('Waiting for service worker to be ready...')
      await navigator.serviceWorker.ready
      
      setSwRegistration(registration)
      setTestStatus('Service worker registered and ready')
      
      // Small delay to ensure service worker is fully activated
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Subscribe to push
      await subscribeToPush(registration)
    } catch (error) {
      console.error('Service worker registration error:', error)
      setTestError('Failed to register service worker: ' + error.message)
    }
  }

  const subscribeToPush = async (registration) => {
    try {
      setTestStatus('Creating push subscription...')
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        console.log('Existing subscription found:', subscription)
        setSubscription(subscription)
        setTestStatus('Using existing push subscription')
      } else {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        console.log('VAPID Public Key:', vapidKey)
        
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          })
          
          console.log('New subscription created:', subscription)
          setSubscription(subscription)
          setTestStatus('Push subscription created')
        } catch (subError) {
          console.error('Subscription error details:', subError)
          throw subError
        }
      }
      
      // Save subscription to server
      await saveSubscription(subscription)
    } catch (error) {
      console.error('Push subscription error:', error)
      setTestError('Failed to subscribe: ' + error.message)
    }
  }

  const saveSubscription = async (subscription) => {
    try {
      setTestStatus('Saving subscription to server...')
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          landingId: 'test_push_page',
          domain: window.location.hostname,
          url: window.location.href,
          accessStatus: 'allowed',
          browserInfo: {
            browser: getBrowserName(),
            version: getBrowserVersion(),
            os: getOS(),
            device: 'desktop',
            language: navigator.language,
            platform: navigator.platform
          },
          location: {
            country: 'United States',
            city: 'Test City',
            ip: '127.0.0.1'
          }
        })
      })
      
      if (response.ok) {
        setTestStatus('Subscription saved successfully!')
      } else {
        throw new Error('Failed to save subscription')
      }
    } catch (error) {
      setTestError('Failed to save subscription: ' + error.message)
    }
  }

  const sendTestNotification = async () => {
    try {
      setTestError('')
      setTestStatus('Sending test notification...')
      
      // First, get the client ID for this subscription
      const clientsResponse = await fetch('/api/clients')
      const clientsData = await clientsResponse.json()
      
      // Find our test client
      const testClient = clientsData.clients?.find(c => 
        c.endpoint === subscription?.endpoint
      )
      
      if (!testClient) {
        throw new Error('Test client not found. Please refresh and try again.')
      }
      
      // Send notification
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: [testClient.id],
          notification: {
            title: 'Test Notification 🎉',
            message: 'This is a test push notification from your Push Platform!',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            url: '/test-push',
            tag: 'test-notification-' + Date.now(), // Unique tag to ensure notification shows
            requireInteraction: false,
            vibrate: [200, 100, 200],
            actions: [
              { action: 'view', title: 'View' },
              { action: 'dismiss', title: 'Dismiss' }
            ]
          },
          testMode: true
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTestStatus('Notification sent successfully! Check your notifications.')
      } else {
        throw new Error(result.error || 'Failed to send notification')
      }
    } catch (error) {
      setTestError(error.message)
      setTestStatus('')
    }
  }

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const getBrowserName = () => {
    const ua = navigator.userAgent
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) return 'Chrome'
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari'
    if (ua.indexOf('Firefox') > -1) return 'Firefox'
    if (ua.indexOf('Edg') > -1) return 'Edge'
    return 'Unknown'
  }

  const getBrowserVersion = () => {
    const ua = navigator.userAgent
    const match = ua.match(/(Chrome|Safari|Firefox|Edg)\/(\d+)/)
    return match ? match[2] : 'Unknown'
  }

  const getOS = () => {
    const ua = navigator.userAgent
    if (ua.indexOf('Win') > -1) return 'Windows'
    if (ua.indexOf('Mac') > -1) return 'macOS'
    if (ua.indexOf('Linux') > -1) return 'Linux'
    if (ua.indexOf('Android') > -1) return 'Android'
    if (ua.indexOf('iOS') > -1) return 'iOS'
    return 'Unknown'
  }

  return (
    <DashboardLayout>
      <Container className="py-4">
        <h1 className="h3 mb-4">Test Push Notifications</h1>
        
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Permission Status</h5>
            <div className="d-flex align-items-center mb-3">
              {permission === 'granted' ? (
                <Badge bg="success" className="d-flex align-items-center">
                  <FiCheck className="me-1" /> Notifications Allowed
                </Badge>
              ) : permission === 'denied' ? (
                <Badge bg="danger" className="d-flex align-items-center">
                  <FiX className="me-1" /> Notifications Blocked
                </Badge>
              ) : (
                <Badge bg="warning" className="d-flex align-items-center">
                  <FiInfo className="me-1" /> Permission Not Granted
                </Badge>
              )}
            </div>
            
            {permission !== 'granted' && (
              <Button onClick={requestPermission} variant="primary">
                <FiBell className="me-2" />
                Request Permission
              </Button>
            )}
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Service Worker Status</h5>
            <div className="mb-3">
              {swRegistration ? (
                <Badge bg="success">Service Worker Registered</Badge>
              ) : (
                <Badge bg="secondary">No Service Worker</Badge>
              )}
            </div>
            
            {!swRegistration && permission === 'granted' && (
              <Button onClick={registerServiceWorker} variant="primary">
                Register Service Worker
              </Button>
            )}
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Body>
            <h5 className="mb-3">Push Subscription</h5>
            <div className="mb-3">
              {subscription ? (
                <>
                  <Badge bg="success" className="mb-2">Subscribed to Push</Badge>
                  <div className="text-muted small">
                    Endpoint: {subscription.endpoint.substring(0, 50)}...
                  </div>
                </>
              ) : (
                <Badge bg="secondary">Not Subscribed</Badge>
              )}
            </div>
            
            {subscription && (
              <Button onClick={sendTestNotification} variant="success">
                <FiBell className="me-2" />
                Send Test Notification
              </Button>
            )}
          </Card.Body>
        </Card>
        
        {testStatus && (
          <Alert variant="info">
            {testStatus}
          </Alert>
        )}
        
        {testError && (
          <Alert variant="danger">
            {testError}
          </Alert>
        )}
        
        <Card>
          <Card.Body>
            <h5 className="mb-3">How to Test</h5>
            <ol>
              <li>Click "Request Permission" if not already granted</li>
              <li>Wait for service worker to register automatically</li>
              <li>Click "Send Test Notification" to receive a push notification</li>
              <li>Check your system notifications</li>
            </ol>
            
            <Alert variant="warning" className="mt-3">
              <strong>Note:</strong> Make sure your browser supports notifications and they are not disabled at the system level.
            </Alert>
          </Card.Body>
        </Card>
      </Container>
    </DashboardLayout>
  )
}