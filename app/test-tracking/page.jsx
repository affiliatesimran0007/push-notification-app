'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Bell, Bug, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export default function TestTrackingPage() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [trackingEvents, setTrackingEvents] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  // Fetch clients
  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      toast.error('Failed to fetch clients')
    }
  }

  const fetchTrackingEvents = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/analytics/track')
      const data = await response.json()
      setTrackingEvents(data.events || [])
    } catch (error) {
      console.error('Failed to fetch tracking events:', error)
    }
    setRefreshing(false)
  }

  const sendTestNotification = async () => {
    if (!selectedClient) {
      toast.error('Please select a client')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/notifications/test-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClient })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Test notification sent! Check your browser and console logs.')
        console.log('Test notification details:', data)
      } else {
        toast.error(data.error || 'Failed to send test notification')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Failed to send test notification')
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-6 w-6" />
            Test Click Tracking
          </CardTitle>
          <CardDescription>
            Debug click tracking by sending test notifications and monitoring the tracking events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Select Client */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Step 1: Select a Client</h3>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a client to test" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <span>{client.userAgent.includes('Chrome') ? '🌐' : '🦊'}</span>
                      <span>{client.id.slice(0, 8)}...</span>
                      <Badge variant="outline" className="text-xs">
                        {client.browser} on {client.os}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Send Test Notification */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Step 2: Send Test Notification</h3>
            <Button 
              onClick={sendTestNotification} 
              disabled={!selectedClient || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Send Test Notification with Tracking
                </>
              )}
            </Button>
          </div>

          {/* Step 3: Monitor Console */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Step 3: Check Browser Console</h3>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm space-y-2">
              <p>Open your browser's Developer Tools (F12) and check:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Console logs in the tab where you subscribed</li>
                <li>Service Worker logs (Application → Service Workers → View logs)</li>
                <li>Network tab for tracking requests to <code>/api/analytics/track</code></li>
              </ul>
            </div>
          </div>

          {/* Step 4: View Tracking Events */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Step 4: Recent Tracking Events</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTrackingEvents}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </div>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {trackingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">
                  No tracking events yet. Click the notification when it arrives!
                </p>
              ) : (
                <div className="space-y-2">
                  {trackingEvents.slice(0, 10).map((event) => (
                    <div key={event.id} className="text-xs p-2 bg-slate-50 dark:bg-slate-900 rounded">
                      <div className="flex items-center justify-between">
                        <Badge variant={event.event === 'notification_clicked' ? 'default' : 'secondary'}>
                          {event.event}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {event.campaignId && (
                        <div className="mt-1 text-muted-foreground">
                          Campaign: {event.campaignId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Debug Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Debug Information</h3>
            <div className="text-xs space-y-1 p-3 bg-slate-100 dark:bg-slate-800 rounded font-mono">
              <div>Service Worker Version: Check console for version</div>
              <div>Tracking URL: {process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/analytics/track</div>
              <div>
                <a 
                  href="/push-sw.js" 
                  target="_blank" 
                  className="text-blue-500 hover:underline inline-flex items-center gap-1"
                >
                  View Service Worker
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}