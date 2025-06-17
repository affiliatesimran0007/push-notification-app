'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, Form, Row, Col, Spinner } from 'react-bootstrap'

export default function IconPicker({ show, onHide, onSelect, currentIcon }) {
  const [icons, setIcons] = useState([])
  const [defaultIcons, setDefaultIcons] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIcon, setSelectedIcon] = useState(currentIcon || '')
  const [customUrl, setCustomUrl] = useState('')
  const [activeTab, setActiveTab] = useState('default') // 'default', 'custom'

  useEffect(() => {
    if (show) {
      fetchIcons()
    }
  }, [show])

  const fetchIcons = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/icons')
      const data = await response.json()
      
      if (response.ok) {
        setIcons(data.icons || [])
        setDefaultIcons(data.defaultIcons || [])
      }
    } catch (error) {
      console.error('Failed to fetch icons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = () => {
    if (activeTab === 'custom' && customUrl) {
      onSelect(customUrl)
    } else if (selectedIcon) {
      onSelect(selectedIcon)
    }
    onHide()
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Choose Icon</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <Button
            variant={activeTab === 'default' ? 'primary' : 'outline-primary'}
            size="sm"
            className="me-2"
            onClick={() => setActiveTab('default')}
          >
            Default Icons
          </Button>
          <Button
            variant={activeTab === 'custom' ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={() => setActiveTab('custom')}
          >
            Custom URL
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading icons...</p>
          </div>
        ) : (
          <>
            {activeTab === 'default' ? (
              <div>
                <h6 className="mb-3">Available Icons</h6>
                <Row className="g-3">
                  {/* Default icons */}
                  {defaultIcons.map((icon, index) => (
                    <Col xs={6} sm={4} md={3} key={`default-${index}`}>
                      <div
                        className={`border rounded p-3 text-center cursor-pointer ${
                          selectedIcon === (icon.url || icon.emoji) ? 'border-primary bg-light' : ''
                        }`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedIcon(icon.url || icon.emoji)}
                      >
                        {icon.isEmoji ? (
                          <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                            {icon.emoji}
                          </div>
                        ) : (
                          <img
                            src={icon.url}
                            alt={icon.name}
                            style={{
                              width: '48px',
                              height: '48px',
                              objectFit: 'contain',
                              marginBottom: '10px'
                            }}
                          />
                        )}
                        <small className="d-block">{icon.name}</small>
                      </div>
                    </Col>
                  ))}
                  
                  {/* File system icons */}
                  {icons.map((icon, index) => (
                    <Col xs={6} sm={4} md={3} key={`file-${index}`}>
                      <div
                        className={`border rounded p-3 text-center cursor-pointer ${
                          selectedIcon === icon.url ? 'border-primary bg-light' : ''
                        }`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedIcon(icon.url)}
                      >
                        <img
                          src={icon.url}
                          alt={icon.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'contain',
                            marginBottom: '10px'
                          }}
                        />
                        <small className="d-block">{icon.name}</small>
                      </div>
                    </Col>
                  ))}
                </Row>
                
                {selectedIcon && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <strong>Selected:</strong> {selectedIcon}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h6 className="mb-3">Custom Icon URL</h6>
                <Form.Group>
                  <Form.Label>Icon URL</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://example.com/icon.png"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Enter a direct URL to a PNG, JPEG, or WebP image (192x192px recommended)
                  </Form.Text>
                </Form.Group>
                
                {customUrl && (
                  <div className="mt-3 text-center">
                    <img
                      src={customUrl}
                      alt="Custom icon preview"
                      style={{
                        width: '96px',
                        height: '96px',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSelect}
          disabled={activeTab === 'default' ? !selectedIcon : !customUrl}
        >
          Select Icon
        </Button>
      </Modal.Footer>
    </Modal>
  )
}