'use client'

import { useState } from 'react'
import { MDBBtn, MDBIcon } from 'mdb-react-ui-kit'

export default function NotificationTester({ subscription }) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)

  const testNotification = async () => {
    setTesting(true)
    setResult(null)

    try {
      // First check browser permission
      if (Notification.permission !== 'granted') {
        setResult({ 
          success: false, 
          message: 'Browser permission denied. Please allow notifications in browser settings.' 
        })
        return
      }

      // Try to show a test notification
      const reg = await navigator.serviceWorker.ready
      const testTitle = 'Test Notification 🔔'
      
      await reg.showNotification(testTitle, {
        body: 'If you see this, notifications are working!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'test-' + Date.now(),
        requireInteraction: false
      })

      // Check if notification is visible
      await new Promise(resolve => setTimeout(resolve, 1000))
      const notifications = await reg.getNotifications()
      const found = notifications.find(n => n.title === testTitle)

      if (found) {
        setResult({ 
          success: true, 
          message: '✅ Notifications are working correctly!' 
        })
        setTimeout(() => found.close(), 3000)
      } else {
        setResult({ 
          success: false, 
          message: '⚠️ Notifications are enabled but blocked by your system settings',
          details: [
            'Check Windows Focus Assist (turn it OFF)',
            'Check Do Not Disturb mode',
            'Allow Chrome in Windows Settings → Notifications',
            'Notifications may still appear in Action Center'
          ]
        })
      }
    } catch (error) {
      setResult({ 
        success: false, 
        message: 'Error: ' + error.message 
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="notification-tester">
      <MDBBtn 
        color="info" 
        size="sm" 
        onClick={testNotification}
        disabled={testing || !subscription}
      >
        <MDBIcon icon={testing ? 'spinner' : 'bell'} spin={testing} className="me-2" />
        Test Notifications
      </MDBBtn>

      {result && (
        <div className={`mt-3 p-3 rounded ${result.success ? 'bg-success' : 'bg-warning'} bg-opacity-10`}>
          <p className={`mb-0 ${result.success ? 'text-success' : 'text-warning'}`}>
            {result.message}
          </p>
          {result.details && (
            <ul className="mb-0 mt-2 small">
              {result.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          )}
          {!result.success && (
            <a 
              href="https://support.google.com/chrome/answer/3220216" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-link p-0 mt-2"
            >
              View Chrome notification help →
            </a>
          )}
        </div>
      )}
    </div>
  )
}