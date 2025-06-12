'use client'

import { useEffect } from 'react'

export default function ServiceWorkerProvider() {
  useEffect(() => {
    // Register service worker on app load
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      // Check if service worker is already registered
      navigator.serviceWorker.getRegistration('/').then((registration) => {
        if (!registration) {
          // Register if not already registered
          navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
              console.log('Service Worker registered by provider:', reg.scope)
              
              // Check for updates every 30 seconds
              setInterval(() => {
                reg.update()
              }, 30000)
            })
            .catch((error) => {
              console.error('Service Worker registration failed:', error)
            })
        } else {
          console.log('Service Worker already registered:', registration.scope)
        }
      })
    }
  }, [])

  return null
}