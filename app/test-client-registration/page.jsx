'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, Button, Alert } from 'react-bootstrap'

export default function TestClientRegistration() {
  const [logs, setLogs] = useState([])
  const [isTestingRedirect, setIsTestingRedirect] = useState(false)
  
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
  }

  // Monitor network requests
  useEffect(() => {
    // Override fetch to log requests
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const [url, options] = args
      
      if (url.includes('/api/clients')) {
        addLog(`📡 API Call: ${options?.method || 'GET'} ${url}`, 'network')
        if (options?.body) {
          try {
            const body = JSON.parse(options.body)
            addLog(`📦 Request Body: ${JSON.stringify(body, null, 2)}`, 'network')
          } catch (e) {
            addLog(`📦 Request Body: ${options.body}`, 'network')
          }
        }
      }
      
      try {
        const response = await originalFetch(...args)
        
        if (url.includes('/api/clients')) {
          addLog(`✅ Response Status: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error')
          
          // Clone response to read body without consuming it
          const clonedResponse = response.clone()
          try {
            const responseData = await clonedResponse.json()
            addLog(`📥 Response Data: ${JSON.stringify(responseData, null, 2)}`, 'network')
          } catch (e) {
            addLog(`📥 Response: Unable to parse JSON`, 'warning')
          }
        }
        
        return response
      } catch (error) {
        if (url.includes('/api/clients')) {
          addLog(`❌ Network Error: ${error.message}`, 'error')
        }
        throw error
      }
    }
    
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  const testDirectRegistration = async () => {
    addLog('🚀 Starting direct registration test...', 'info')
    
    try {
      // Check service worker support
      if (!('serviceWorker' in navigator)) {
        addLog('❌ Service Worker not supported', 'error')
        return
      }
      
      if (!('PushManager' in window)) {
        addLog('❌ Push API not supported', 'error')
        return
      }
      
      addLog('✅ Browser supports push notifications', 'success')
      
      // Request permission
      addLog('📋 Requesting notification permission...', 'info')
      const permission = await Notification.requestPermission()
      addLog(`📋 Permission result: ${permission}`, permission === 'granted' ? 'success' : 'warning')
      
      if (permission !== 'granted') {
        addLog('⚠️ Permission not granted, stopping test', 'warning')
        return
      }
      
      // Register service worker
      addLog('🔧 Registering service worker...', 'info')
      const registration = await navigator.serviceWorker.register('/push-sw.js')
      addLog('✅ Service worker registered', 'success')
      
      // Wait for activation
      await navigator.serviceWorker.ready
      addLog('✅ Service worker ready', 'success')
      
      // Get VAPID key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      addLog(`🔑 VAPID Key: ${vapidKey?.substring(0, 20)}...`, 'info')
      
      // Subscribe to push
      addLog('📬 Subscribing to push...', 'info')
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })
      
      addLog('✅ Push subscription created', 'success')
      addLog(`📍 Endpoint: ${subscription.endpoint}`, 'info')
      
      // Prepare client data
      const clientData = {
        subscription: subscription.toJSON(),
        landingId: 'test-landing-id',
        domain: window.location.hostname,
        url: window.location.href,
        accessStatus: 'allowed',
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: { country: 'Unknown', city: 'Unknown' }
      }
      
      addLog('📤 Sending registration to server...', 'info')
      addLog(`🌐 API URL: ${window.location.origin}/api/clients`, 'info')
      
      // Make API call (will be logged by fetch override)
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      })
      
      if (response.ok) {
        addLog('🎉 Client registration successful!', 'success')
      } else {
        addLog(`❌ Registration failed: ${response.status} ${response.statusText}`, 'error')
      }
      
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error')
      console.error('Full error:', error)
    }
  }

  const testRedirectFlow = () => {
    setIsTestingRedirect(true)
    addLog('🔄 Testing redirect flow...', 'info')
    
    // Simulate what happens in push-widget.js
    const simulateRedirectFlow = async () => {
      try {
        // 1. Show bot check overlay
        addLog('🤖 Bot check overlay would be shown', 'info')
        
        // 2. User completes bot check
        addLog('✅ Bot check completed (simulated)', 'info')
        
        // 3. Request permission
        addLog('📋 Requesting permission...', 'info')
        const permission = await Notification.requestPermission()
        addLog(`📋 Permission: ${permission}`, permission === 'granted' ? 'success' : 'warning')
        
        if (permission === 'granted') {
          // 4. Redirect happens IMMEDIATELY
          addLog('🔀 REDIRECT TO ALLOW URL (this is where the issue might be)', 'warning')
          addLog('⚠️ registerPushSubscription() called in background', 'warning')
          
          // 5. Background registration (might not complete before redirect)
          setTimeout(() => {
            addLog('📬 Background: Starting push subscription...', 'info')
            setTimeout(() => {
              addLog('📤 Background: Calling /api/clients...', 'info')
              setTimeout(() => {
                addLog('⚠️ Background: But page already redirected!', 'error')
              }, 500)
            }, 1000)
          }, 100)
          
          // Simulate redirect
          setTimeout(() => {
            addLog('🚪 Page would redirect to: /thank-you', 'error')
            addLog('❌ Any pending API calls might be cancelled!', 'error')
          }, 200)
        }
      } catch (error) {
        addLog(`❌ Error: ${error.message}`, 'error')
      }
    }
    
    simulateRedirectFlow()
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

  const clearLogs = () => setLogs([])

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-success'
      case 'error': return 'text-danger'
      case 'warning': return 'text-warning'
      case 'network': return 'text-primary'
      default: return ''
    }
  }

  return (
    <div className="container mt-4">
      <h1>Client Registration Debug</h1>
      
      <Card className="mb-4">
        <CardBody>
          <h5>Test Registration Flow</h5>
          <p>This page helps debug why clients aren't being saved to the database.</p>
          
          <div className="d-flex gap-2 mb-3">
            <Button onClick={testDirectRegistration}>
              Test Direct Registration
            </Button>
            <Button variant="warning" onClick={testRedirectFlow}>
              Test Redirect Flow Issue
            </Button>
            <Button variant="secondary" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>
          
          <Alert variant="info">
            <strong>The Issue:</strong> When bot protection is enabled and redirects are configured,
            the page redirects BEFORE the API call to save the client completes. This causes the
            client registration to fail because the network request is cancelled when the page navigates away.
          </Alert>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h5>Debug Logs</h5>
          <div className="bg-dark text-light p-3 rounded" style={{ maxHeight: '600px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9em' }}>
            {logs.length === 0 ? (
              <div className="text-muted">No logs yet. Click a test button to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-2 ${getLogColor(log.type)}`}>
                  <span className="text-muted">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}