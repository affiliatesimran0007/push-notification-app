'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Form, Alert, Table, Badge } from 'react-bootstrap'
import DashboardLayout from '@/components/DashboardLayout'

export default function TestTracking() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const data = await response.json()
      setClients(data.clients || [])
    } catch (err) {
      setError('Failed to fetch clients')
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotification = async () => {
    if (!selectedClient) {
      setError('Please select a client')
      return
    }

    setSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: [selectedClient],
          notification: {
            title: '🧪 Test Click Tracking',
            message: 'Click this notification to test tracking!',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            url: 'https://push-notification-app-steel.vercel.app/test-tracking',
            campaignId: 'test-' + Date.now(),
            requireInteraction: true,
            actions: [
              { action: 'button1', title: 'Test Button 1', url: 'https://example.com/button1' },
              { action: 'button2', title: 'Test Button 2', url: 'https://example.com/button2' }
            ]
          },
          testMode: true
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to send notification')
      }
    } catch (err) {
      setError('Failed to send test notification: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout>
      <Container className="py-4">
        <h1 className="h3 mb-4">Test Click Tracking</h1>
        
        <Row>
          <Col lg={8}>
            <Card>
              <Card.Body>
                <h5 className="mb-3">Send Test Notification</h5>
                
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                
                {result && (
                  <Alert variant="success">
                    <h6>Notification Sent!</h6>
                    <p>Sent: {result.sent} | Failed: {result.failed}</p>
                    {result.errorDetails?.length > 0 && (
                      <div>
                        <strong>Errors:</strong>
                        <ul>
                          {result.errorDetails.map((err, i) => (
                            <li key={i}>{err.error}: {err.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Alert>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Label>Select Client</Form.Label>
                  <Form.Select
                    value={selectedClient || ''}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">-- Select a client --</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.browser} on {client.os} - {client.subscribedUrl || 'Unknown'} 
                        {client.accessStatus === 'allowed' && ' ✅'}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  onClick={sendTestNotification}
                  disabled={!selectedClient || sending}
                >
                  {sending ? 'Sending...' : 'Send Test Notification'}
                </Button>
                
                <hr className="my-4" />
                
                <h5 className="mb-3">How to Test</h5>
                <ol>
                  <li>Select a client from the dropdown above</li>
                  <li>Click "Send Test Notification"</li>
                  <li>Wait for the notification to appear on that device</li>
                  <li>Click the notification or one of its buttons</li>
                  <li>Check the browser console logs (F12) for tracking messages</li>
                  <li>Check the Network tab for requests to /api/analytics/track</li>
                </ol>
                
                <Alert variant="info" className="mt-3">
                  <strong>Note:</strong> Make sure the client's service worker is updated to the latest version.
                  The tracking URL should be: <code>https://push-notification-app-steel.vercel.app/api/analytics/track</code>
                </Alert>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card>
              <Card.Body>
                <h5 className="mb-3">Debug Info</h5>
                
                <h6>Service Worker Version</h6>
                <p className="text-muted">
                  push-sw.js: v2.3.0<br />
                  push-sw-template.js: v1.2.0
                </p>
                
                <h6>Expected Console Logs</h6>
                <code className="d-block p-2 bg-light">
                  [Service Worker] Click data: {'{...}'}<br />
                  [Service Worker] Sending click tracking to: https://...<br />
                  [Service Worker] Click tracked successfully
                </code>
                
                <h6 className="mt-3">Common Issues</h6>
                <ul className="small">
                  <li>Old service worker cached - needs update</li>
                  <li>CORS errors - check console</li>
                  <li>Network errors - check connectivity</li>
                  <li>Missing trackingUrl in payload</li>
                </ul>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  )
}