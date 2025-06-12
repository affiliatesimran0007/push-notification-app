'use client'

import { useState, useEffect } from 'react'
import { MDBCard, MDBCardBody, MDBBtn, MDBIcon } from 'mdb-react-ui-kit'
import { Row, Col, Card, Badge, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap'
import { FiEye, FiChrome } from 'react-icons/fi'
import DashboardLayout from '@/components/DashboardLayout'
import { useApi, apiCall } from '@/lib/hooks/useApi'

export default function PushTemplates() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  // Build API URL with category filter
  const apiUrl = `/api/templates${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`
  const { data, loading, error: fetchError, refetch } = useApi(apiUrl)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: '',
    title: '',
    message: '',
    variables: [],
    icon: '📢',
    image: '',
    sound: 'default',
    buttons: [],
    requireInteraction: false,
    badge: ''
  })
  const [previewDevice, setPreviewDevice] = useState('desktop')
  const [showFullPreview, setShowFullPreview] = useState(false)

  const playNotificationSound = (soundType) => {
    if (!soundType || soundType === 'none') return
    
    if (soundType === 'windows') {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+zPDZhjMGHGS56+OjWRUKTqzn4bllHQU8ktXxy3ksBSl+zPDZhjMHHWq+6+OhUxMKUbHq46xZEglHnuDyvmwhBSl+zPDZhjMGHGS56+OjWRUKTqzn4bllHQU8ktXxy3ksBSl+zPDZhjMHHWq+6+OhUxMKUbHq46xZEglHnuDyvmwhBSl+zPDZhjMGHGS56+OjWRUKTqzn4bllHQU8ktXxy3ksBSl+zPDZhjMHHWq+6+OhUxMKUbHq46xZEglHnuDyvmwhBSl+zPDZhjMGHGS56+OjWRUKTqzn4bllHQU8ktXxy3ksBSl+zPDZhjMHHWq+6+OhUxMKUbHq46xZEglHnuDyvmwhBSl+zPDZhjMGHGS56+OjWRUKTqzn4bllHQU8ktXxy3ksBSl+zPDZhjMHHWq+6+OhUxMKUbHq46xZEglHnuDyvmwhBSl+zPDZhjMGHGS56+OjWRUKTqzn4bllHQU8ktXxy3ksBU2Gy9zdmEUABCx3y+jyjQABABVbs+zjpwABABdhu+/onAAABDmY3vy7hAAJWaTc3KYBAAk1k9nwyIkAAAJlmu/GbAAAJ3DA79mGBAAAAmSj79yVCAkYdr7Zgi4BABdkst+gKUgMPJva89djAwAHQJzn3r5fEAlFqufl1EoABEyy6N6rKQADJIDB3a6ABAAMYLzs02oAAAZwt+XXqgAFS6XenS4AAANNr/DmpQAFMHul4agFAABYrO/mywBSSKXj4bgADEif38STAC1FneXalAACPJTl05UAAAMzbNnjvwBKopXUyAAATKzdzKMAC1mr0bkABDuL1r6YDgACSZ3ayKIABDyP2sKfAABGntPEsAALVZ/UxagAD2Kp1blqAAljo+bfqgEAC1+s5NqmBAMFM4zb8M+iAAUvcNfyzmkCBQAAS67f0pkACGux48qOABJfq9C6aAEAE3Cp1L9VCAMUarns3Z0DAQ42idnxzIYCAwAChM3155cHAA0ug9bu1nQABQANUKzfz4UBCAUvhM/1024AAAVUsuXWlAEGHmWb3NWlAAcMQJzYy4MABg9Jm8/BkAAHFWSYyLyAAAddmtK+hAAIHVyWwbCAAAxHiLi7jQAHEnmbu7mSAAgUY4zEtr0AAlqHx8WfAApJi7m+jQAFEmuZzt2cAAlXmdXMrwATPJLZ2LoAEEiGvb6YABBRhLi0nwAHRIDAv58AAEmh2NCYAAxUnM+8lgADUai/v5EAA01wuNThAApFlM3CpgALQIXGspAAAlaazdKRADNfl8rStgAASJzWzrEACE+Vtb5YCgouddXqtAAAT4y4tWkABDmRyNbOAAU5h8bMywAJOIfH0sMAAziCv8a8AAN8qcW+fgARYJ2+sVkDATyU1+jjAA9PmtS7lgADRpPDw7cAAlCMvLNvAg9AlMO/mQEAB06UtMuIAAdWmMHAkgADUY3AvKcABlOLvMeVAwZCkc7TpwAJSYzHwpEBA0mLur6BAAtFhLevmgAGUYrBr3wCCEKSxsqmBAUveLrJtwALYJW6uFgICFOhzNCbBgQxltLXnwkEOozFyqEABlmexbVuBAVJodG7owEBBiaS2+u7AAAABGOy5dNcAAAlmufmrQAEUYW0xLEAAg0+jL++lgABRHG60NaaAAdHhbS1jwAGR4q7vYIABm+ixbV7AAlJir+2bQUNgbSyiAAAQ5vOv6EBB0mbtLiPBAlske3NdwADR5m1so8EBlGJur6cAARS')
      audio.volume = 0.5
      audio.play().catch(err => {
        console.log('Windows sound failed, using fallback:', err)
        playSimpleBeep(800, 200)
      })
      return
    }
    
    const frequencies = {
      default: 800,
      custom1: 1000,
      custom2: 600,
      custom3: 1200
    }
    
    playSimpleBeep(frequencies[soundType] || 800, 200)
  }
  
  const playSimpleBeep = (frequency, duration) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (err) {
      console.log('Web Audio API not supported:', err)
    }
  }

  const handleCreateTemplate = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await apiCall('/api/templates', {
        method: 'POST',
        body: JSON.stringify(newTemplate)
      })

      if (response.success) {
        setShowTemplateModal(false)
        refetch()
        // Reset form
        setNewTemplate({
          name: '',
          category: '',
          title: '',
          message: '',
          variables: [],
          icon: '📢',
          image: '',
          sound: 'default',
          buttons: [],
          requireInteraction: false,
          badge: ''
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const templates = data?.templates || []

  return (
    <DashboardLayout>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Push Templates</h1>
          <MDBBtn 
            color="primary" 
            onClick={() => setShowTemplateModal(true)}
          >
            <MDBIcon fas icon="plus" className="me-2" />
            Create Custom Template
          </MDBBtn>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <Button 
            variant={selectedCategory === 'all' ? 'primary' : 'outline-primary'} 
            size="sm" 
            className="me-2"
            onClick={() => setSelectedCategory('all')}
          >
            All Templates
          </Button>
          <Button 
            variant={selectedCategory === 'ecommerce' ? 'primary' : 'outline-primary'} 
            size="sm" 
            className="me-2"
            onClick={() => setSelectedCategory('ecommerce')}
          >
            E-commerce
          </Button>
          <Button 
            variant={selectedCategory === 'engagement' ? 'primary' : 'outline-primary'} 
            size="sm" 
            className="me-2"
            onClick={() => setSelectedCategory('engagement')}
          >
            Engagement
          </Button>
          <Button 
            variant={selectedCategory === 'content' ? 'primary' : 'outline-primary'} 
            size="sm" 
            className="me-2"
            onClick={() => setSelectedCategory('content')}
          >
            Content
          </Button>
          <Button 
            variant={selectedCategory === 'transactional' ? 'primary' : 'outline-primary'} 
            size="sm"
            onClick={() => setSelectedCategory('transactional')}
          >
            Transactional
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading templates...</p>
          </div>
        ) : fetchError ? (
          <Alert variant="danger">
            Error loading templates: {fetchError}
          </Alert>
        ) : (
          <Row>
            {templates.map((template) => (
            <Col lg={4} md={6} key={template.id} className="mb-4">
              <Card className="h-100 shadow-sm custom-card border">
                <Card.Body>
                  <div className="text-center mb-3">
                    <div className="display-1 mb-2">{template.icon}</div>
                    <h5>{template.name}</h5>
                    <Badge bg="light" text="dark">{template.category}</Badge>
                  </div>
                  
                  <div className="border rounded p-3 bg-light mb-3">
                    <strong className="d-block mb-1 small">{template.title}</strong>
                    <p className="mb-0 small">{template.message}</p>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">Variables:</small>
                    <div className="d-flex gap-1 flex-wrap mt-1">
                      {template.variables.map((variable, index) => (
                        <Badge key={index} bg="secondary" pill>
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    <Button variant="primary" size="sm" className="flex-grow-1">
                      Use Template
                    </Button>
                    <Button variant="outline-primary" size="sm">
                      <FiEye />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          </Row>
        )}
      </div>

      {/* Template Creation Modal */}
      <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Create Custom Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Row>
            <Col lg={7}>
              <h5 className="mb-3">Template Details</h5>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Template Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="e.g., Holiday Sale"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        value={newTemplate.category}
                        onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                      >
                        <option value="">Select category</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="Content">Content</option>
                        <option value="Engagement">Engagement</option>
                        <option value="Transactional">Transactional</option>
                        <option value="Custom">Custom</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Notification Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder={`e.g., 🎉 {{eventName}} - {{discount}}% OFF!`}
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                  />
                  <Form.Text className="text-muted">
                    Use {`{{variableName}}`} for dynamic content
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Notification Message</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={2}
                    placeholder={`e.g., Don't miss our {{eventName}}! Get {{discount}}% off on all items.`}
                    value={newTemplate.message}
                    onChange={(e) => setNewTemplate({...newTemplate, message: e.target.value})}
                  />
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Icon (192x192px)</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Icon URL or emoji"
                        value={newTemplate.icon}
                        onChange={(e) => setNewTemplate({...newTemplate, icon: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Badge Icon</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Badge URL (optional)"
                        value={newTemplate.badge}
                        onChange={(e) => setNewTemplate({...newTemplate, badge: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Notification Sound</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Select
                          value={newTemplate.sound}
                          onChange={(e) => {
                            setNewTemplate({...newTemplate, sound: e.target.value})
                            playNotificationSound(e.target.value)
                          }}
                          className="flex-grow-1"
                        >
                          <option value="default">Default</option>
                          <option value="windows">Windows Sound</option>
                          <option value="none">Silent</option>
                          <option value="custom1">Ding</option>
                          <option value="custom2">Chime</option>
                          <option value="custom3">Bell</option>
                        </Form.Select>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => playNotificationSound(newTemplate.sound)}
                          title="Play sound"
                        >
                          <i className="fas fa-play text-primary"></i>
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Hero Image (Optional)</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Image URL (720x480px recommended)"
                    value={newTemplate.image}
                    onChange={(e) => setNewTemplate({...newTemplate, image: e.target.value})}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Action Buttons</Form.Label>
                  <div>
                    {newTemplate.buttons.map((button, index) => (
                      <Row key={index} className="mb-2">
                        <Col md={5}>
                          <Form.Control 
                            type="text" 
                            placeholder="Button text"
                            value={button.text}
                            onChange={(e) => {
                              const updatedButtons = [...newTemplate.buttons]
                              updatedButtons[index].text = e.target.value
                              setNewTemplate({...newTemplate, buttons: updatedButtons})
                            }}
                          />
                        </Col>
                        <Col md={5}>
                          <Form.Control 
                            type="url" 
                            placeholder="Button URL"
                            value={button.url}
                            onChange={(e) => {
                              const updatedButtons = [...newTemplate.buttons]
                              updatedButtons[index].url = e.target.value
                              setNewTemplate({...newTemplate, buttons: updatedButtons})
                            }}
                          />
                        </Col>
                        <Col md={2}>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => {
                              const updatedButtons = newTemplate.buttons.filter((_, i) => i !== index)
                              setNewTemplate({...newTemplate, buttons: updatedButtons})
                            }}
                          >
                            Remove
                          </Button>
                        </Col>
                      </Row>
                    ))}
                    {newTemplate.buttons.length < 2 && (
                      <div className={newTemplate.buttons.length > 0 ? 'mt-2' : ''}>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => {
                            setNewTemplate({
                              ...newTemplate, 
                              buttons: [...newTemplate.buttons, { text: '', url: '' }]
                            })
                          }}
                        >
                          <MDBIcon fas icon="plus" className="me-2" />
                          Add Button
                        </Button>
                      </div>
                    )}
                  </div>
                </Form.Group>

                <Form.Check 
                  type="switch"
                  id="requireInteraction"
                  label="Require user interaction to dismiss"
                  checked={newTemplate.requireInteraction}
                  onChange={(e) => setNewTemplate({...newTemplate, requireInteraction: e.target.checked})}
                />
              </Form>
            </Col>

            <Col lg={5}>
              <h5 className="mb-3">Device Preview</h5>
              
              <div className="d-flex justify-content-center mb-3">
                <Button 
                  variant={previewDevice === 'desktop' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="me-2"
                  onClick={() => {
                    setPreviewDevice('desktop')
                    playNotificationSound(newTemplate.sound)
                  }}
                >
                  Desktop
                </Button>
                <Button 
                  variant={previewDevice === 'android' ? 'primary' : 'outline-primary'}
                  size="sm"
                  className="me-2"
                  onClick={() => {
                    setPreviewDevice('android')
                    playNotificationSound(newTemplate.sound)
                  }}
                >
                  Android
                </Button>
                <Button 
                  variant={previewDevice === 'ios' ? 'primary' : 'outline-primary'}
                  size="sm"
                  onClick={() => {
                    setPreviewDevice('ios')
                    playNotificationSound(newTemplate.sound)
                  }}
                >
                  iOS
                </Button>
              </div>

              {/* Desktop Preview */}
              {previewDevice === 'desktop' && (
                <div className="device-preview-desktop" role="button" onClick={() => setShowFullPreview(true)} style={{ cursor: 'pointer' }}>
                  <div className="device-screen-desktop">
                    <div className="d-flex flex-wrap gap-3 p-3">
                      <div className="text-center">
                        <div className="bg-primary text-white rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                          <FiChrome size={24} />
                        </div>
                        <small className="text-muted d-block mt-1">Chrome</small>
                      </div>
                    </div>
                    
                    <div className="position-absolute bottom-0 end-0 p-4 notification-popup" style={{ marginBottom: '50px' }}>
                      <div className="bg-white rounded-3 shadow-lg p-4" style={{ width: '420px', maxWidth: '90vw' }}>
                        <div className="d-flex align-items-start">
                          <div className="me-3">
                            {newTemplate.icon.startsWith('http') ? (
                              <img src={newTemplate.icon} alt="Icon" width="64" height="64" className="rounded" />
                            ) : (
                              <div style={{ width: '64px', height: '64px', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9ecef', borderRadius: '12px' }}>
                                {newTemplate.icon || '🔔'}
                              </div>
                            )}
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-start mb-2">
                              <div>
                                <h5 className="mb-1">{newTemplate.title || 'Notification Title'}</h5>
                                <small className="text-muted">Push Notification App • now</small>
                              </div>
                              <button className="btn-close ms-auto" aria-label="Close"></button>
                            </div>
                            <p className="mb-3 text-muted">{newTemplate.message || 'Notification message will appear here'}</p>
                            {newTemplate.image && (
                              <img src={newTemplate.image} alt="Notification" className="img-fluid rounded mb-3" style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }} />
                            )}
                            {newTemplate.buttons.length > 0 && (
                              <div className="d-flex gap-2">
                                {newTemplate.buttons.map((button, index) => (
                                  <Button key={index} variant="primary" size="sm" className="px-4">
                                    {button.text || `Button ${index + 1}`}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <small className="text-muted">Click to view full screen</small>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateTemplate}
            disabled={isSubmitting || !newTemplate.name || !newTemplate.title || !newTemplate.message}
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Creating...
              </>
            ) : (
              'Save Template'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}