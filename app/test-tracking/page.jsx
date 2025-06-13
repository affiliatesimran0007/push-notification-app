'use client'

import { useState } from 'react'
import { Button, Form, Alert } from 'react-bootstrap'
import DashboardLayout from '@/components/DashboardLayout'

export default function TestTracking() {
  const [campaignId, setCampaignId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const trackClick = async () => {
    try {
      const response = await fetch('/api/notifications/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId,
          clientId: 'test-client'
        })
      })
      
      const data = await response.json()
      if (response.ok) {
        setResult('Click tracked successfully!')
        setError(null)
      } else {
        setError(data.error || 'Failed to track click')
        setResult(null)
      }
    } catch (err) {
      setError('Error: ' + err.message)
      setResult(null)
    }
  }

  const trackDisplay = async () => {
    try {
      const response = await fetch('/api/notifications/track-display', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId,
          clientId: 'test-client'
        })
      })
      
      const data = await response.json()
      if (response.ok) {
        setResult('Display tracked successfully!')
        setError(null)
      } else {
        setError(data.error || 'Failed to track display')
        setResult(null)
      }
    } catch (err) {
      setError('Error: ' + err.message)
      setResult(null)
    }
  }

  const checkStats = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/stats`)
      const data = await response.json()
      
      if (response.ok) {
        setResult(JSON.stringify(data, null, 2))
        setError(null)
      } else {
        setError(data.error || 'Failed to get stats')
        setResult(null)
      }
    } catch (err) {
      setError('Error: ' + err.message)
      setResult(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="container py-4">
        <h1>Test Tracking</h1>
        <p>Use this page to test campaign tracking endpoints</p>
        
        <Form.Group className="mb-3">
          <Form.Label>Campaign ID</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter campaign ID"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
          />
        </Form.Group>

        <div className="d-flex gap-2 mb-3">
          <Button onClick={trackClick} disabled={!campaignId}>
            Track Click
          </Button>
          <Button onClick={trackDisplay} disabled={!campaignId} variant="info">
            Track Display
          </Button>
          <Button onClick={checkStats} disabled={!campaignId} variant="success">
            Check Stats
          </Button>
        </div>

        {result && (
          <Alert variant="success">
            <pre>{result}</pre>
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}
      </div>
    </DashboardLayout>
  )
}