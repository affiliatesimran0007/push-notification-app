'use client'

import { useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'

export default function LandingRedirect() {
  const params = useParams()
  const searchParams = useSearchParams()
  const landingId = params.landingId

  useEffect(() => {
    // Get landing configuration from database or use defaults
    const domain = searchParams.get('domain') || 'example.com'
    const allowRedirect = searchParams.get('allow') || `https://${domain}/thank-you`
    const blockRedirect = searchParams.get('block') || `https://${domain}/blocked`
    
    // Build bot check URL
    const botCheckParams = new URLSearchParams({
      landingId: landingId,
      domain: domain,
      url: `https://${domain}`,
      allowRedirect: allowRedirect,
      blockRedirect: blockRedirect,
      vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    })
    
    // Add ngrok header if needed
    if (window.location.host.includes('ngrok')) {
      botCheckParams.append('ngrok-skip-browser-warning', 'true')
    }
    
    // Redirect to bot check
    window.location.href = `/landing/bot-check?${botCheckParams.toString()}`
  }, [landingId, searchParams])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Loading...</h2>
        <p>Preparing notification setup...</p>
      </div>
    </div>
  )
}