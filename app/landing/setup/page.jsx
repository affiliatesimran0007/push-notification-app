'use client'

import { useState, useEffect } from 'react'
import { Container, Card, Alert, Tab, Tabs, Button } from 'react-bootstrap'
import DashboardLayout from '@/components/DashboardLayout'
import { FiGlobe, FiServer, FiCheck, FiCopy } from 'react-icons/fi'

export default function LandingSetupGuide() {
  const [copied, setCopied] = useState(false)
  const [platformUrl, setPlatformUrl] = useState('your-push-platform.com')
  
  // Set platform URL after component mounts to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPlatformUrl(window.location.host)
    }
  }, [])
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const platformIP = '123.45.67.89' // Replace with your actual server IP
  
  return (
    <DashboardLayout>
      <Container>
        <h2 className="mb-4">Domain Setup Guide</h2>
        
        <Alert variant="info" className="mb-4">
          <h5>🎯 Professional Domain Setup</h5>
          <p>Point your domain directly to our push notification platform for a fully branded experience. 
          Your visitors will never leave your domain!</p>
        </Alert>
        
        <Tabs defaultActiveKey="subdomain" className="mb-4">
          <Tab eventKey="subdomain" title="Subdomain (Recommended)">
            <Card className="shadow-sm">
              <Card.Body>
                <h4 className="mb-3">
                  <FiGlobe className="me-2" />
                  Setup a Subdomain (e.g., push.yourdomain.com)
                </h4>
                
                <div className="mb-4">
                  <h5>Step 1: Create Your Landing Page</h5>
                  <p>First, create a landing page in the dashboard with your subdomain:</p>
                  <ul>
                    <li>Domain: <code>push.yourdomain.com</code></li>
                    <li>Landing ID: <code>your-unique-id</code></li>
                    <li>Configure redirects and settings</li>
                  </ul>
                </div>
                
                <div className="mb-4">
                  <h5>Step 2: Add DNS Record</h5>
                  <p>Add this CNAME record in your DNS provider:</p>
                  <div className="bg-light p-3 rounded mb-2">
                    <code>
                      Type: CNAME<br />
                      Name: push<br />
                      Value: {platformUrl}<br />
                      TTL: 3600
                    </code>
                  </div>
                  <Button size="sm" variant="outline-secondary" onClick={() => copyToClipboard(platformUrl)}>
                    <FiCopy /> Copy
                  </Button>
                  {copied && <span className="ms-2 text-success">Copied!</span>}
                </div>
                
                <div className="mb-4">
                  <h5>Step 3: Wait for DNS Propagation</h5>
                  <p>DNS changes typically take 5-30 minutes to propagate. You can check status at:</p>
                  <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer">
                    dnschecker.org
                  </a>
                </div>
                
                <Alert variant="success">
                  <FiCheck className="me-2" />
                  Once setup, visitors to <strong>push.yourdomain.com</strong> will see your branded push notification signup!
                </Alert>
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="fulldomain" title="Full Domain">
            <Card className="shadow-sm">
              <Card.Body>
                <h4 className="mb-3">
                  <FiServer className="me-2" />
                  Setup Your Full Domain (e.g., yourdomain.com)
                </h4>
                
                <Alert variant="warning" className="mb-3">
                  <strong>Note:</strong> This will make your entire domain serve the push notification landing page. 
                  Consider using a subdomain instead if you have an existing website.
                </Alert>
                
                <div className="mb-4">
                  <h5>Option A: Using A Record (IP Address)</h5>
                  <div className="bg-light p-3 rounded mb-2">
                    <code>
                      Type: A<br />
                      Name: @<br />
                      Value: {platformIP}<br />
                      TTL: 3600
                    </code>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h5>Option B: Using CNAME (if your DNS provider supports it)</h5>
                  <div className="bg-light p-3 rounded mb-2">
                    <code>
                      Type: CNAME<br />
                      Name: @<br />
                      Value: {platformUrl}<br />
                      TTL: 3600
                    </code>
                  </div>
                  <small className="text-muted">Note: Not all DNS providers support CNAME on root domain</small>
                </div>
              </Card.Body>
            </Card>
          </Tab>
          
          <Tab eventKey="testing" title="Testing">
            <Card className="shadow-sm">
              <Card.Body>
                <h4 className="mb-3">Testing Your Setup</h4>
                
                <ol>
                  <li className="mb-3">
                    <strong>Check DNS Propagation:</strong>
                    <div className="mt-2">
                      <code>nslookup yourdomain.com</code> or use 
                      <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="ms-2">
                        dnschecker.org
                      </a>
                    </div>
                  </li>
                  
                  <li className="mb-3">
                    <strong>Visit Your Domain:</strong>
                    <p>Open your domain in a browser. You should be redirected to the bot check page.</p>
                  </li>
                  
                  <li className="mb-3">
                    <strong>Test in Incognito:</strong>
                    <p>Always test in incognito/private mode to simulate a new visitor.</p>
                  </li>
                  
                  <li className="mb-3">
                    <strong>Check Console:</strong>
                    <p>Open browser DevTools (F12) and check for any errors in the Console tab.</p>
                  </li>
                </ol>
                
                <Alert variant="info">
                  <h6>Troubleshooting:</h6>
                  <ul className="mb-0">
                    <li>If you see "Landing page not found", ensure you created the landing page with the exact domain</li>
                    <li>If DNS isn't working, wait up to 48 hours for full propagation</li>
                    <li>Clear browser cache and cookies if testing multiple times</li>
                  </ul>
                </Alert>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
        
        <Card className="shadow-sm mt-4">
          <Card.Body>
            <h5>Example: Setting up alerts-intuit.com</h5>
            <ol>
              <li>Create landing page with domain: <code>alerts-intuit.com</code></li>
              <li>Add A record pointing to: <code>{platformIP}</code></li>
              <li>Wait for DNS propagation</li>
              <li>Visit alerts-intuit.com - it will show your push notification signup!</li>
            </ol>
          </Card.Body>
        </Card>
      </Container>
    </DashboardLayout>
  )
}