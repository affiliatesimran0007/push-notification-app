'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Form, Alert, Table } from 'react-bootstrap'
import DashboardLayout from '@/components/DashboardLayout'

export default function TestEmojiIcons() {
  const [testResults, setTestResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [customEmoji, setCustomEmoji] = useState('')

  // Test cases with different icons
  const testCases = [
    { name: 'QB Campaign', title: 'Your QuickBooks subscription expired.', icon: '💰', message: 'Action Required: Your QuickBooks Online subscription has expired.' },
    { name: 'Shopping Cart', title: 'Items in your cart', icon: '🛒', message: 'Complete your purchase now!' },
    { name: 'Package', title: 'Order shipped', icon: '📦', message: 'Your order is on the way!' },
    { name: 'News', title: 'Weekly update', icon: '📰', message: 'Check out what\'s new this week' },
    { name: 'URL Icon', title: 'Test with URL', icon: 'https://push-notification-app-steel.vercel.app/icon-192x192.png', message: 'Testing with proper URL icon' },
    { name: 'Default Icon', title: 'Test with default', icon: '', message: 'Testing with no icon specified' }
  ]

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const testNotification = async (testCase) => {
    setLoading(true)
    const result = { ...testCase, status: 'testing', error: null }
    
    try {
      // First test payload creation
      const payloadResponse = await fetch('/api/test-emoji-icons/payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testCase.title,
          message: testCase.message,
          icon: testCase.icon
        })
      })
      
      const payloadData = await payloadResponse.json()
      
      if (!payloadResponse.ok) {
        result.status = 'failed'
        result.error = payloadData.error || 'Failed to create payload'
        result.details = payloadData
      } else {
        result.payloadSize = payloadData.payloadSize
        result.iconUrl = payloadData.payload.icon
        result.validationPassed = payloadData.validationPassed
        
        // If client selected, try sending
        if (selectedClient) {
          const sendResponse = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientIds: [selectedClient],
              notification: {
                title: testCase.title,
                message: testCase.message,
                icon: testCase.icon,
                url: 'https://example.com',
                requireInteraction: true
              },
              testMode: true
            })
          })
          
          const sendData = await sendResponse.json()
          
          if (sendResponse.ok && sendData.sent > 0) {
            result.status = 'success'
            result.sent = sendData.sent
            result.failed = sendData.failed
          } else {
            result.status = 'failed'
            result.error = sendData.error || 'Failed to send notification'
            result.errorDetails = sendData.errorDetails
          }
        } else {
          result.status = 'payload-only'
        }
      }
    } catch (error) {
      result.status = 'error'
      result.error = error.message
    }
    
    setTestResults(prev => [...prev, result])
    setLoading(false)
  }

  const runAllTests = async () => {
    setTestResults([])
    for (const testCase of testCases) {
      await testNotification(testCase)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const testCustomEmoji = () => {
    if (customEmoji) {
      testNotification({
        name: 'Custom Emoji',
        title: 'Custom emoji test',
        icon: customEmoji,
        message: 'Testing with custom emoji: ' + customEmoji
      })
    }
  }

  return (
    <DashboardLayout>
      <Container fluid>
        <h1 className="h3 mb-4">Emoji Icon Test Page</h1>
        
        <Alert variant="info">
          This page tests notification sending with emoji icons to diagnose the QB campaign issue.
        </Alert>

        <Card className="mb-4">
          <Card.Body>
            <h5>Test Configuration</h5>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Select Client (optional)</Form.Label>
                  <Form.Select 
                    value={selectedClient} 
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    <option value="">Test payload only (no send)</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.browser} - {client.os} ({client.accessStatus})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select a client to actually send notifications, or leave empty to just test payload creation.
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Custom Emoji Test</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      placeholder="Enter emoji (e.g., 🎉)"
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      maxLength={4}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={testCustomEmoji}
                      disabled={!customEmoji || loading}
                    >
                      Test
                    </Button>
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Button 
              variant="primary" 
              onClick={runAllTests}
              disabled={loading}
            >
              Run All Tests
            </Button>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <h5>Test Results</h5>
            {testResults.length === 0 ? (
              <p className="text-muted">No tests run yet. Click "Run All Tests" to begin.</p>
            ) : (
              <Table responsive>
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Icon</th>
                    <th>Converted Icon</th>
                    <th>Payload Size</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index}>
                      <td>{result.name}</td>
                      <td>
                        {result.icon.startsWith('http') ? (
                          <a href={result.icon} target="_blank" rel="noopener noreferrer">URL</a>
                        ) : (
                          <span style={{ fontSize: '1.5em' }}>{result.icon || '(none)'}</span>
                        )}
                      </td>
                      <td>
                        {result.iconUrl && (
                          <small className="text-break">{result.iconUrl.substring(0, 50)}...</small>
                        )}
                      </td>
                      <td>{result.payloadSize ? `${result.payloadSize} bytes` : '-'}</td>
                      <td>
                        <span className={`badge bg-${
                          result.status === 'success' ? 'success' : 
                          result.status === 'failed' ? 'danger' : 
                          result.status === 'payload-only' ? 'info' : 
                          'warning'
                        }`}>
                          {result.status}
                        </span>
                      </td>
                      <td>
                        {result.error && (
                          <div className="text-danger small">
                            {result.error}
                            {result.errorDetails && (
                              <details>
                                <summary>Details</summary>
                                <pre className="small">{JSON.stringify(result.errorDetails, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                        )}
                        {result.status === 'success' && (
                          <span className="text-success small">
                            Sent: {result.sent}, Failed: {result.failed}
                          </span>
                        )}
                        {result.validationPassed === false && (
                          <span className="text-warning small d-block">Validation warnings</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </DashboardLayout>
  )
}