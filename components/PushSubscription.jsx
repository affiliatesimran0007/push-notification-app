'use client'

import { useState, useEffect } from 'react'
import { Button, Alert, Spinner } from 'react-bootstrap'
import { FiBell, FiBellOff } from 'react-icons/fi'
import pushService from '@/lib/pushService'

export default function PushSubscription() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permission, setPermission] = useState('default')

  useEffect(() => {
    checkPushSupport()
  }, [])

  const checkPushSupport = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if push notifications are supported
      const supported = pushService.checkSupport()
      setIsSupported(supported)

      if (!supported) {
        setIsLoading(false)
        return
      }

      // Check permission status
      const perm = Notification.permission
      setPermission(perm)

      // Initialize push service
      await pushService.init()

      // Check if already subscribed
      const subscription = await pushService.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (err) {
      console.error('Error checking push support:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const subscription = await pushService.subscribe()
      if (subscription) {
        setIsSubscribed(true)
        setPermission('granted')
        
        // Send test notification
        setTimeout(() => {
          pushService.sendTestNotification()
        }, 2000)
      }
    } catch (err) {
      console.error('Subscription error:', err)
      setError(err.message)
      setPermission(Notification.permission)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    try {
      setIsLoading(true)
      setError(null)

      await pushService.unsubscribe()
      setIsSubscribed(false)
    } catch (err) {
      console.error('Unsubscribe error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Alert variant="warning">
        <FiBellOff className="me-2" />
        Push notifications are not supported in this browser.
      </Alert>
    )
  }

  if (permission === 'denied') {
    return (
      <Alert variant="danger">
        <FiBellOff className="me-2" />
        Push notifications have been blocked. Please enable them in your browser settings.
      </Alert>
    )
  }

  return (
    <div className="push-subscription">
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>Checking notification status...</span>
        </div>
      ) : isSubscribed ? (
        <div>
          <Alert variant="success">
            <FiBell className="me-2" />
            You are subscribed to push notifications!
          </Alert>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={handleUnsubscribe}
            disabled={isLoading}
          >
            <FiBellOff className="me-2" />
            Unsubscribe
          </Button>
        </div>
      ) : (
        <div>
          <Alert variant="info">
            <FiBellOff className="me-2" />
            Enable push notifications to stay updated!
          </Alert>
          <Button 
            variant="primary" 
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            <FiBell className="me-2" />
            Enable Push Notifications
          </Button>
        </div>
      )}

      <style jsx>{`
        .push-subscription {
          margin: 20px 0;
        }
      `}</style>
    </div>
  )
}