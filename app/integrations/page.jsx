'use client'

import { useState } from 'react'
import { Container, Row, Col, Card, Button, Badge, Form, Modal } from 'react-bootstrap'
import { 
  FiLink, FiCheck, FiX, FiSettings, FiCode, FiExternalLink,
  FiShoppingCart, FiFileText, FiZap, FiDatabase, FiBarChart,
  FiMail, FiSlack, FiGlobe
} from 'react-icons/fi'
import { 
  SiZapier, SiShopify, SiWordpress, SiWoocommerce, 
  SiGoogleanalytics
} from 'react-icons/si'
import { TbWebhook } from 'react-icons/tb'
import DashboardLayout from '@/components/DashboardLayout'

export default function IntegrationsPage() {
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState(null)

  const integrations = [
    {
      id: 'zapier',
      name: 'Zapier',
      icon: SiZapier,
      category: 'Automation',
      description: 'Connect with 5,000+ apps and automate workflows',
      status: 'connected',
      color: '#FF4A00',
      features: ['Automated triggers', 'Multi-step workflows', 'Conditional logic']
    },
    {
      id: 'segment',
      name: 'Segment',
      icon: FiDatabase,
      category: 'Analytics',
      description: 'Collect, clean, and control customer data',
      status: 'disconnected',
      color: '#52BD94',
      features: ['Data collection', 'User tracking', 'Event streaming']
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      icon: SiGoogleanalytics,
      category: 'Analytics',
      description: 'Track and report website traffic',
      status: 'connected',
      color: '#F9AB00',
      features: ['Conversion tracking', 'Audience insights', 'Real-time data']
    },
    {
      id: 'shopify',
      name: 'Shopify',
      icon: SiShopify,
      category: 'E-commerce',
      description: 'Send targeted notifications to your customers',
      status: 'disconnected',
      color: '#7AB55C',
      features: ['Order updates', 'Cart abandonment', 'Product launches']
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      icon: SiWordpress,
      category: 'CMS',
      description: 'WordPress plugin for easy integration',
      status: 'disconnected',
      color: '#21759B',
      features: ['One-click install', 'Shortcode support', 'User sync']
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      icon: SiWoocommerce,
      category: 'E-commerce',
      description: 'Enhanced e-commerce notifications',
      status: 'disconnected',
      color: '#96588A',
      features: ['Order notifications', 'Customer segments', 'Product alerts']
    },
    {
      id: 'webhook',
      name: 'Webhooks',
      icon: TbWebhook,
      category: 'Developer',
      description: 'Custom integrations via webhooks',
      status: 'connected',
      color: '#4A5568',
      features: ['Real-time events', 'Custom payloads', 'Retry logic']
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: FiSlack,
      category: 'Communication',
      description: 'Get notifications in Slack channels',
      status: 'disconnected',
      color: '#4A154B',
      features: ['Campaign alerts', 'Performance reports', 'Team notifications']
    }
  ]

  const categories = ['All', 'Automation', 'Analytics', 'E-commerce', 'CMS', 'Developer', 'Communication']
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredIntegrations = selectedCategory === 'All' 
    ? integrations 
    : integrations.filter(int => int.category === selectedCategory)

  const handleConfigure = (integration) => {
    setSelectedIntegration(integration)
    setShowConfigModal(true)
  }

  const connectedCount = integrations.filter(int => int.status === 'connected').length

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h2>Integrations</h2>
        <p className="text-muted">Connect your favorite tools and services</p>
      </div>

      {/* Stats Overview */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1">Total Integrations</h6>
                  <h3 className="mb-0">{integrations.length}</h3>
                </div>
                <FiLink size={32} className="text-primary" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1">Connected</h6>
                  <h3 className="mb-0">{connectedCount}</h3>
                </div>
                <FiCheck size={32} className="text-success" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1">Available</h6>
                  <h3 className="mb-0">{integrations.length - connectedCount}</h3>
                </div>
                <FiX size={32} className="text-secondary" />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted mb-1">Categories</h6>
                  <h3 className="mb-0">{categories.length - 1}</h3>
                </div>
                <FiDatabase size={32} className="text-info" />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Category Filter */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="d-flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Integrations Grid */}
      <Row>
        {filteredIntegrations.map((integration) => {
          const Icon = integration.icon
          return (
            <Col md={6} lg={4} key={integration.id} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center">
                      <div 
                        className="p-3 rounded-circle me-3" 
                        style={{ 
                          backgroundColor: `${integration.color}20`,
                          color: integration.color 
                        }}
                      >
                        <Icon size={24} />
                      </div>
                      <div>
                        <h5 className="mb-0">{integration.name}</h5>
                        <Badge bg="light" text="dark" className="mt-1">
                          {integration.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge 
                      bg={integration.status === 'connected' ? 'success' : 'secondary'}
                      className="px-2 py-1"
                    >
                      {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                    </Badge>
                  </div>
                  
                  <p className="text-muted mb-3">{integration.description}</p>
                  
                  <div className="mb-3">
                    <small className="text-muted">Key Features:</small>
                    <ul className="small mb-0 ps-3">
                      {integration.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="d-flex gap-2">
                    {integration.status === 'connected' ? (
                      <>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleConfigure(integration)}
                        >
                          <FiSettings className="me-1" /> Configure
                        </Button>
                        <Button variant="outline-danger" size="sm">
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleConfigure(integration)}
                      >
                        Connect
                      </Button>
                    )}
                    <Button variant="outline-secondary" size="sm">
                      <FiExternalLink className="me-1" /> Docs
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* Configuration Modal */}
      <Modal show={showConfigModal} onHide={() => setShowConfigModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedIntegration?.status === 'connected' ? 'Configure' : 'Connect'} {selectedIntegration?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedIntegration?.id === 'zapier' && (
            <div>
              <h6>Zapier Configuration</h6>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Zapier API Key</Form.Label>
                  <Form.Control type="text" placeholder="Enter your Zapier API key" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Webhook URL</Form.Label>
                  <Form.Control 
                    type="text" 
                    value="https://hooks.zapier.com/hooks/catch/123456/abcdef/"
                    readOnly
                  />
                  <Form.Text>Copy this URL to your Zapier trigger</Form.Text>
                </Form.Group>
              </Form>
            </div>
          )}
          
          {selectedIntegration?.id === 'google-analytics' && (
            <div>
              <h6>Google Analytics Configuration</h6>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Tracking ID</Form.Label>
                  <Form.Control type="text" placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox" 
                    label="Enable enhanced e-commerce tracking"
                    defaultChecked
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox" 
                    label="Track notification clicks as events"
                    defaultChecked
                  />
                </Form.Group>
              </Form>
            </div>
          )}
          
          {selectedIntegration?.id === 'webhook' && (
            <div>
              <h6>Webhook Configuration</h6>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Webhook URL</Form.Label>
                  <Form.Control type="url" placeholder="https://your-domain.com/webhook" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Events to Send</Form.Label>
                  <Form.Check type="checkbox" label="Subscription created" defaultChecked />
                  <Form.Check type="checkbox" label="Notification sent" defaultChecked />
                  <Form.Check type="checkbox" label="Notification clicked" defaultChecked />
                  <Form.Check type="checkbox" label="Subscription removed" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Authentication</Form.Label>
                  <Form.Select>
                    <option>None</option>
                    <option>Basic Auth</option>
                    <option>Bearer Token</option>
                    <option>Custom Header</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </div>
          )}

          {/* Default configuration for other integrations */}
          {!['zapier', 'google-analytics', 'webhook'].includes(selectedIntegration?.id) && (
            <div>
              <p>Configuration options for {selectedIntegration?.name} will be available soon.</p>
              <p className="text-muted">
                In the meantime, please refer to our documentation for manual setup instructions.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfigModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            {selectedIntegration?.status === 'connected' ? 'Save Changes' : 'Connect'}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}