'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FiGlobe, FiPlus, FiEdit2, FiTrash2, FiExternalLink, FiCode, FiInfo, FiCopy, FiPlayCircle } from 'react-icons/fi'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default function LandingPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [selectedLanding, setSelectedLanding] = useState(null)
  const [editingLanding, setEditingLanding] = useState(null)
  const [testStatus, setTestStatus] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    landingId: '',
    botProtection: true,
    allowRedirectUrl: '',
    blockRedirectUrl: ''
  })
  const [landingPages, setLandingPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Fetch landing pages on component mount
  useEffect(() => {
    fetchLandingPages()
  }, [])

  const fetchLandingPages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/landing')
      if (!response.ok) throw new Error('Failed to fetch landing pages')
      const data = await response.json()
      setLandingPages(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleShowCode = (landing) => {
    setSelectedLanding(landing)
    setShowCodeModal(true)
  }

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      domain: '',
      landingId: '',
      botProtection: true,
      allowRedirectUrl: '',
      blockRedirectUrl: ''
    })
    setEditingLanding(null)
    setShowCreateModal(true)
  }

  const handleOpenEditModal = (landing) => {
    setFormData({
      name: landing.name,
      domain: landing.domain || landing.url?.replace('https://', '').replace('http://', '').split('/')[0],
      landingId: landing.landingId,
      botProtection: landing.botProtection !== false,
      allowRedirectUrl: landing.allowRedirectUrl || '',
      blockRedirectUrl: landing.blockRedirectUrl || ''
    })
    setEditingLanding(landing)
    setShowEditModal(true)
  }

  const handleCreateLanding = async () => {
    // Validate form
    if (!formData.name || !formData.domain || !formData.landingId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/landing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create landing page')
      }

      // Add to list
      setLandingPages([...landingPages, data])
      
      // Reset form and close modal
      setFormData({
        name: '',
        domain: '',
        landingId: '',
        botProtection: true,
        allowRedirectUrl: '',
        blockRedirectUrl: ''
      })
      setShowCreateModal(false)
      
      // Show the integration code
      setTimeout(() => {
        handleShowCode(data)
      }, 500)
    } catch (err) {
      setError(err.message)
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLanding = async (id) => {
    if (!confirm('Are you sure you want to delete this landing page?')) return
    
    try {
      const response = await fetch(`/api/landing?id=${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete landing page')
      
      setLandingPages(landingPages.filter(page => page.id !== id))
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleUpdateLanding = async () => {
    // Validate form
    if (!formData.name || !formData.domain || !formData.landingId) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch('/api/landing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          id: editingLanding.id
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update landing page')
      }

      // Update in list
      setLandingPages(landingPages.map(page => 
        page.id === editingLanding.id ? data : page
      ))
      
      // Close modal
      setShowEditModal(false)
      setEditingLanding(null)
      
    } catch (err) {
      setError(err.message)
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const getIntegrationCode = (landing) => {
    if (!landing) return ''
    
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://push-notification-app-steel.vercel.app'
    
    return `<!-- Push Notification Integration Code -->
<!-- Domain: ${landing.domain} | Landing Page: ${landing.name} -->
<script>
(function() {
  // Configuration
  window.PUSH_CONFIG = {
    appUrl: '${appUrl}',
    landingId: '${landing.landingId}',
    vapidKey: '${vapidKey}',
    domain: '${landing.domain}',
    botProtection: ${landing.botProtection},
    redirects: {
      enabled: ${landing.enableRedirect || false},
      onAllow: ${landing.allowRedirectUrl ? `'${landing.allowRedirectUrl}'` : 'null'},
      onBlock: ${landing.blockRedirectUrl ? `'${landing.blockRedirectUrl}'` : 'null'}
    }
  };
  
  // Load push notification widget
  const script = document.createElement('script');
  script.src = window.PUSH_CONFIG.appUrl + '/js/push-widget.js?v=' + Date.now();
  script.async = true;
  script.onload = function() {
    console.log('Push notification widget loaded for ${landing.name}');
  };
  document.head.appendChild(script);
})();
</script>`
  }

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h2>Landing Pages</h2>
      </div>

      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <h5>What are Landing Pages?</h5>
              <p className="text-muted mb-3">
                Landing pages are the entry points where users can subscribe to push notifications. 
                Each landing page has its own unique configuration and bot protection to ensure quality subscribers.
              </p>
              <div className="d-flex gap-3">
                <Link href="/landing/bot-check" className="btn btn-outline-primary">
                  <FiExternalLink className="me-2" />
                  View Bot Check Demo
                </Link>
                <Link href="/landing/setup" className="btn btn-outline-success">
                  <FiGlobe className="me-2" />
                  Domain Setup Guide
                </Link>
                <Button variant="outline-secondary" onClick={() => setShowCodeModal(true)}>
                  <FiCode className="me-2" />
                  JavaScript Integration
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Your Landing Pages</h5>
                <Button 
                  variant="primary" 
                  onClick={handleOpenCreateModal}
                  className="d-flex align-items-center gap-2"
                >
                  <FiPlus /> Create Landing Page
                </Button>
              </div>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" />
                  <p className="mt-2">Loading landing pages...</p>
                </div>
              ) : error ? (
                <Alert variant="danger">
                  <strong>Error:</strong> {error}
                </Alert>
              ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>URL</th>
                    <th>Status</th>
                    <th>Redirect</th>
                    <th>Subscribers</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {landingPages.map((landing) => (
                    <tr key={landing.id}>
                      <td className="fw-bold">{landing.name}</td>
                      <td>
                        <a href={landing.url} target="_blank" rel="noopener noreferrer">
                          {landing.url}
                        </a>
                      </td>
                      <td>
                        <span className={`badge bg-${landing.status === 'active' ? 'success' : 'secondary'}`}>
                          {landing.status}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span className={`badge bg-${landing.enableRedirect ? 'info' : 'danger'} mb-1`}>
                            {landing.enableRedirect ? 'Enabled' : 'Disabled'}
                          </span>
                          {landing.enableRedirect && (
                            <div className="small mt-1">
                              <div className="text-success">
                                <strong>Allow:</strong> {landing.allowRedirectUrl || 'Not set'}
                              </div>
                              <div className="text-danger">
                                <strong>Block:</strong> {landing.blockRedirectUrl || 'Not set'}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{landing.subscribers.toLocaleString()}</td>
                      <td>{landing.created}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => handleShowCode(landing)}
                            title="View Code"
                          >
                            <FiCode />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-info"
                            onClick={() => {
                              setSelectedLanding(landing)
                              setShowTestModal(true)
                              setTestStatus('')
                            }}
                            title="Test Integration"
                          >
                            <FiPlayCircle />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-secondary"
                            onClick={() => handleOpenEditModal(landing)}
                            title="Edit"
                          >
                            <FiEdit2 />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleDeleteLanding(landing.id)}
                            title="Delete"
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Landing Page Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Landing Page</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Landing Page Name *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g., Main Website, Blog Section" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Domain *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="example.com (without https://)" 
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                required
              />
              <Form.Text className="text-muted">
                Enter domain without protocol (e.g., alerts-intuit.com)
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Landing Page ID *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="unique-landing-id" 
                value={formData.landingId}
                onChange={(e) => setFormData({...formData, landingId: e.target.value})}
                required
              />
              <Form.Text className="text-muted">
                A unique identifier for this landing page
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check 
                type="switch"
                label="Enable Bot Protection"
                checked={formData.botProtection}
                onChange={(e) => setFormData({...formData, botProtection: e.target.checked})}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Enable GDPR compliance features"
                defaultChecked
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Require double opt-in"
              />
            </Form.Group>
            
            <hr className="my-4" />
            
            <h6 className="mb-3">Redirect Settings</h6>
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Enable custom redirects after permission prompt"
                id="enableRedirect"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Redirect URL on Allow</Form.Label>
              <Form.Control 
                type="url" 
                placeholder="https://example.com/thank-you"
                value={formData.allowRedirectUrl}
                onChange={(e) => setFormData({...formData, allowRedirectUrl: e.target.value})}
              />
              <Form.Text className="text-muted">
                Where to redirect users after they allow notifications
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Redirect URL on Block</Form.Label>
              <Form.Control 
                type="url" 
                placeholder="https://example.com/notifications-info"
                value={formData.blockRedirectUrl}
                onChange={(e) => setFormData({...formData, blockRedirectUrl: e.target.value})}
              />
              <Form.Text className="text-muted">
                Where to redirect users after they block notifications
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateLanding}
            disabled={saving}
          >
            {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Create Landing Page
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Landing Page Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Landing Page</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Landing Page Name *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="e.g., Main Website, Blog Section" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Domain *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="example.com (without https://)" 
                value={formData.domain}
                onChange={(e) => setFormData({...formData, domain: e.target.value})}
                required
              />
              <Form.Text className="text-muted">
                Enter domain without protocol (e.g., alerts-intuit.com)
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Landing Page ID *</Form.Label>
              <Form.Control 
                type="text" 
                placeholder="unique-landing-id" 
                value={formData.landingId}
                onChange={(e) => setFormData({...formData, landingId: e.target.value})}
                disabled
              />
              <Form.Text className="text-muted">
                Landing Page ID cannot be changed
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check 
                type="switch"
                label="Enable Bot Protection"
                checked={formData.botProtection}
                onChange={(e) => setFormData({...formData, botProtection: e.target.checked})}
              />
            </Form.Group>
            
            <hr className="my-4" />
            
            <h6 className="mb-3">Redirect Settings</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Redirect URL on Allow</Form.Label>
              <Form.Control 
                type="url" 
                placeholder="https://example.com/thank-you"
                value={formData.allowRedirectUrl}
                onChange={(e) => setFormData({...formData, allowRedirectUrl: e.target.value})}
              />
              <Form.Text className="text-muted">
                Where to redirect users after they allow notifications
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Redirect URL on Block</Form.Label>
              <Form.Control 
                type="url" 
                placeholder="https://example.com/notifications-info"
                value={formData.blockRedirectUrl}
                onChange={(e) => setFormData({...formData, blockRedirectUrl: e.target.value})}
              />
              <Form.Text className="text-muted">
                Where to redirect users after they block notifications
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateLanding}
            disabled={saving}
          >
            {saving ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Update Landing Page
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Integration Code Modal */}
      <Modal show={showCodeModal} onHide={() => setShowCodeModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedLanding ? `Integration Code - ${selectedLanding.name}` : 'Integration Guide'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <FiInfo className="me-2" />
            <strong>Domain:</strong> {selectedLanding?.domain} | <strong>Landing ID:</strong> {selectedLanding?.landingId}
          </Alert>
          
          <h5 className="mb-3">1. Add Service Worker File</h5>
          <p className="mb-3">
            First, you need to host a service worker file on your domain. This file handles push notifications.
          </p>
          <div className="mb-4">
            <Button 
              variant="primary" 
              onClick={() => {
                const link = document.createElement('a')
                link.href = '/push-sw-template.js'
                link.download = 'push-sw.js'
                link.click()
              }}
            >
              <FiCopy className="me-2" />
              Download push-sw.js
            </Button>
            <p className="text-muted mt-2">
              Upload to: <code>https://{selectedLanding?.domain}/push-sw.js</code>
            </p>
          </div>
          
          
          <hr className="my-4" />
          
          <h5 className="mb-3">2. Add Integration Code</h5>
          <p className="mb-3">
            Copy this code and add it to your website's HTML, preferably in the &lt;head&gt; section:
          </p>
          
          <div className="position-relative">
            <Button 
              size="sm" 
              variant="outline-light" 
              className="position-absolute top-0 end-0 m-2"
              onClick={() => {
                navigator.clipboard.writeText(getIntegrationCode(selectedLanding))
                alert('Code copied to clipboard!')
              }}
            >
              <FiCopy className="me-1" /> Copy
            </Button>
            <div className="bg-dark text-light p-3 rounded" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
              <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {getIntegrationCode(selectedLanding)}
              </pre>
            </div>
          </div>
          
          <hr className="my-4" />
          
          <h5 className="mb-3">3. Test Integration</h5>
          <p>After adding both the service worker and integration code to your website:</p>
          
          <div className="d-flex gap-3 mb-3">
            <Button 
              variant="success"
              onClick={() => {
                if (selectedLanding?.domain) {
                  window.open(`https://${selectedLanding.domain}`, '_blank')
                }
              }}
              disabled={!selectedLanding?.domain}
            >
              <FiExternalLink className="me-2" />
              Visit Your Website
            </Button>
            
            <Button 
              variant="primary"
              onClick={() => {
                setShowCodeModal(false)
                setShowTestModal(true)
                setTestStatus('')
              }}
            >
              <FiPlayCircle className="me-2" />
              Test Integration Here
            </Button>
          </div>
          
          <Alert variant="warning">
            <h6>Important Notes:</h6>
            <ul className="mb-0">
              <li>Your domain MUST be HTTPS-enabled (required for service workers)</li>
              <li>The <code>push-sw.js</code> file MUST be accessible at the root of your domain</li>
              <li>Bot protection (if enabled) will show verification in an overlay - visitors stay on your domain</li>
              <li>Users who have already subscribed won't see the prompt again</li>
              <li>Test the service worker by visiting: <code>https://{selectedLanding?.domain}/push-sw.js</code></li>
            </ul>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCodeModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Test Integration Modal */}
      <Modal show={showTestModal} onHide={() => setShowTestModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Test Integration - {selectedLanding?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <FiInfo className="me-2" />
            Testing integration for <strong>{selectedLanding?.domain}</strong> with Landing ID: <strong>{selectedLanding?.landingId}</strong>
          </Alert>
          
          <div className="text-center p-4">
            <h5 className="mb-4">Click the button below to test the push notification flow</h5>
            
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => {
                setTestStatus('loading')
                
                // Create test configuration
                window.PUSH_TEST_CONFIG = {
                  appUrl: window.location.origin,
                  landingId: selectedLanding?.landingId,
                  vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BGv2Vm45eFGslcXFhakD-euIXAnOg6-bdqVWHoSw4gwvjvYYV1zBA_Q7uiNij5yvRqMwmDhpBYYSA1v5Z_GEv_k',
                  domain: selectedLanding?.domain,
                  botProtection: selectedLanding?.botProtection !== false,
                  redirects: {
                    enabled: false,
                    onAllow: null,
                    onBlock: null
                  }
                }
                
                // Load and initialize the widget
                const script = document.createElement('script')
                script.src = window.PUSH_TEST_CONFIG.appUrl + '/js/push-widget.js'
                script.async = true
                script.onload = () => {
                  setTestStatus('Widget loaded! Bot protection will appear if enabled...')
                  
                  // Override PUSH_CONFIG for testing
                  window.PUSH_CONFIG = window.PUSH_TEST_CONFIG
                  
                  // Re-initialize the widget
                  if (window.PushWidget) {
                    window.PushWidget.init()
                  }
                }
                script.onerror = () => {
                  setTestStatus('Error loading widget')
                }
                
                // Clean up any existing script
                const existingScript = document.querySelector('script[src*="push-widget.js"]')
                if (existingScript) {
                  existingScript.remove()
                }
                
                document.head.appendChild(script)
              }}
              disabled={testStatus === 'loading'}
            >
              {testStatus === 'loading' ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading...
                </>
              ) : (
                <>
                  <FiPlayCircle className="me-2" />
                  Start Integration Test
                </>
              )}
            </Button>
            
            {testStatus && testStatus !== 'loading' && (
              <Alert variant="success" className="mt-4">
                {testStatus}
              </Alert>
            )}
          </div>
          
          <hr className="my-4" />
          
          <div className="bg-light p-3 rounded">
            <h6>What will happen:</h6>
            <ol className="mb-0">
              <li>Push widget will load on this page</li>
              <li>If bot protection is enabled, you'll see the verification overlay</li>
              <li>Browser will ask for notification permission</li>
              <li>Your choice will be recorded in the Push Clients</li>
              <li>You stay on this page throughout the process</li>
            </ol>
          </div>
          
          <Alert variant="warning" className="mt-3">
            <strong>Note:</strong> This is a test environment. In production, the widget loads automatically when visitors land on your website.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowTestModal(false)
            setTestStatus('')
            // Clean up test config
            delete window.PUSH_TEST_CONFIG
            delete window.PUSH_CONFIG
          }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}