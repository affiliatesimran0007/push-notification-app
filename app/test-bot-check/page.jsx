'use client'

import { useState } from 'react'
import { Container, Card, Button } from 'react-bootstrap'

export default function TestBotCheckPage() {
  const [showIframe, setShowIframe] = useState(false)

  return (
    <Container className="py-5">
      <Card>
        <Card.Body>
          <h1>Test Bot Check Page</h1>
          <p>This page tests the bot-check behavior in different scenarios.</p>
          
          <div className="mb-4">
            <h3>Test 1: Direct Access</h3>
            <p>Click the link below to access the bot-check page directly (should show error):</p>
            <a href="/landing/bot-check?domain=test.com" target="_blank" className="btn btn-primary">
              Open Bot Check Directly
            </a>
          </div>
          
          <div className="mb-4">
            <h3>Test 2: Iframe Access</h3>
            <p>Click the button below to load bot-check in an iframe (should work normally):</p>
            <Button onClick={() => setShowIframe(!showIframe)}>
              {showIframe ? 'Hide' : 'Show'} Bot Check in Iframe
            </Button>
            
            {showIframe && (
              <div className="mt-3" style={{ border: '1px solid #ddd', padding: '10px' }}>
                <iframe
                  src="/landing/bot-check?embedded=true&domain=test.com"
                  style={{ width: '100%', height: '600px', border: 'none' }}
                  title="Bot Check Test"
                />
              </div>
            )}
          </div>
          
          <div className="alert alert-info">
            <h5>Expected Behavior:</h5>
            <ul>
              <li>Direct access: Should show "Invalid Access Method" error</li>
              <li>Iframe access (Firefox/Edge): Should show soft prompt immediately</li>
              <li>Iframe access (Chrome/Safari): Should show loading dots for 1.5s, then send bot-check-verified message to parent</li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}