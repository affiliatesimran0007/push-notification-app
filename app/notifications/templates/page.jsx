'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Row, Col, Card, Badge, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap'
import { FiCheck, FiX, FiTrash2, FiEdit2 } from 'react-icons/fi'
import DashboardLayout from '@/components/DashboardLayout'

export default function PushTemplates() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: '',
    title: '',
    message: '',
    icon: '',
    iconType: 'url' // 'url' or 'emoji'
  })
  const [creationSuccess, setCreationSuccess] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [uploadedIcon, setUploadedIcon] = useState(null)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch templates from API
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/templates')
      const data = await response.json()
      
      if (response.ok) {
        setTemplates(data.templates || [])
      } else {
        setError(data.error || 'Failed to fetch templates')
      }
    } catch (err) {
      setError('Failed to fetch templates')
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter templates by category
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category.toLowerCase() === selectedCategory.toLowerCase())

  const getCategoryColor = (category) => {
    const colors = {
      'e-commerce': 'primary',
      'ecommerce': 'primary',
      'content': 'info',
      'engagement': 'success',
      'transactional': 'warning'
    }
    return colors[category?.toLowerCase()] || 'secondary'
  }
  
  const formatCategoryName = (category) => {
    if (!category) return ''
    const formatted = category.replace(/-/g, ' ')
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
  }

  const handleIconUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setNewTemplate({...newTemplate, icon: base64String})
        setUploadedIcon(file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTemplate.name,
          category: newTemplate.category,
          title: newTemplate.title,
          message: newTemplate.message,
          icon: newTemplate.icon && newTemplate.icon.trim() !== '' ? newTemplate.icon : '',
          sound: 'default',
          requireInteraction: false
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCreationSuccess(true)
        
        // Refresh the page or update the templates list
        setTimeout(() => {
          setShowCreateModal(false)
          setCreationSuccess(false)
          // Reset form
          setNewTemplate({
            name: '',
            category: '',
            title: '',
            message: '',
            icon: '',
            iconType: 'url'
          })
          setShowNewCategory(false)
          setCustomCategory('')
          setUploadedIcon(null)
          
          // Refresh templates list
          fetchTemplates()
        }, 1500)
      } else {
        alert(data.error || 'Failed to create template')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template. Please try again.')
    }
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate({
      ...template,
      iconType: template.icon && (template.icon.startsWith('http') || template.icon.startsWith('data:')) ? 'url' : 'emoji'
    })
    setShowEditModal(true)
  }

  const handleUpdateTemplate = async () => {
    try {
      const response = await fetch(`/api/templates?id=${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate)
      })

      const data = await response.json()

      if (response.ok) {
        // Update the template in local state
        setTemplates(templates.map(t => 
          t.id === editingTemplate.id ? data.template : t
        ))
        setShowEditModal(false)
        alert('Template updated successfully')
      } else {
        alert(data.error || 'Failed to update template')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      alert('Failed to update template. Please try again.')
    }
  }

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Remove the template from the local state
        setTemplates(templates.filter(t => t.id !== templateId))
        alert('Template deleted successfully')
      } else {
        alert(data.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">Push Templates</h1>
            <p className="text-muted mb-0">Choose from pre-built templates to get started quickly</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Custom Template
          </Button>
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

        {/* Template Cards */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading templates...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
        <Row className="g-4">
          {filteredTemplates.map((template) => (
            <Col lg={4} md={6} xs={12} key={template.id}>
              <Card 
                className="h-100 shadow-sm border"
                style={{ 
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                <Card.Body className="p-4">
                  {/* Icon Section */}
                  <div className="text-center mb-3">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                      style={{ 
                        width: '120px', 
                        height: '120px',
                        backgroundColor: '#f8f9fa',
                        padding: '20px'
                      }}
                    >
                      {template.icon && (template.icon.startsWith('http') || template.icon.startsWith('data:')) ? (
                        <img 
                          src={template.icon} 
                          alt={template.name}
                          style={{ 
                            width: '80px', 
                            height: '80px',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '3rem' }}>
                          {template.icon || '📄'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="text-center">
                    <div className="mb-2">
                      <Badge bg={getCategoryColor(template.category)}>
                        {formatCategoryName(template.category)}
                      </Badge>
                    </div>
                    
                    <h5 className="mb-3">{template.name}</h5>
                    
                    <div className="bg-light rounded p-3 mb-3">
                      <h6 className="text-dark mb-2" style={{ fontSize: '16px' }}>
                        {template.title}
                      </h6>
                      
                      <p className="text-muted mb-0 small" style={{ 
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}>
                        {template.message}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2">
                      <Button 
                        variant="primary"
                        className="flex-grow-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Store template data in sessionStorage
                          sessionStorage.setItem('selectedTemplate', JSON.stringify(template))
                          // Navigate to campaign builder
                          router.push('/notifications/campaign-builder')
                        }}
                      >
                        Select Template
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditTemplate(template)
                        }}
                        title="Edit template"
                      >
                        <FiEdit2 />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteTemplate(template.id, template.name)
                        }}
                        title="Delete template"
                      >
                        <FiTrash2 />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        )}
      </div>

      {/* Create Template Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Custom Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {creationSuccess ? (
            <Alert variant="success" className="text-center">
              <FiCheck size={48} className="mb-3 text-success" />
              <h5>Template Created Successfully!</h5>
              <p className="mb-0">Your custom template has been saved.</p>
            </Alert>
          ) : (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Template Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Weekend Sale"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category *</Form.Label>
                    {!showNewCategory ? (
                      <Form.Select
                        value={newTemplate.category}
                        onChange={(e) => {
                          if (e.target.value === 'create-new') {
                            setShowNewCategory(true)
                            setNewTemplate({...newTemplate, category: ''})
                          } else {
                            setNewTemplate({...newTemplate, category: e.target.value})
                          }
                        }}
                      >
                        <option value="">Select category</option>
                        <option value="ecommerce">E-commerce</option>
                        <option value="content">Content</option>
                        <option value="engagement">Engagement</option>
                        <option value="transactional">Transactional</option>
                        <option value="create-new" className="fw-bold">+ Create New Category</option>
                      </Form.Select>
                    ) : (
                      <div className="d-flex gap-2">
                        <Form.Control
                          type="text"
                          placeholder="Enter new category name"
                          value={customCategory}
                          onChange={(e) => {
                            setCustomCategory(e.target.value)
                            setNewTemplate({...newTemplate, category: e.target.value})
                          }}
                          autoFocus
                        />
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          onClick={() => {
                            setShowNewCategory(false)
                            setCustomCategory('')
                            setNewTemplate({...newTemplate, category: ''})
                          }}
                        >
                          <FiX />
                        </Button>
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Notification Title *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., ⚡ Flash Sale - 50% OFF Everything!"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                  maxLength={65}
                />
                <Form.Text className="text-muted">
                  {newTemplate.title.length}/65 characters
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notification Message *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="e.g., Hurry! Our biggest sale of the year ends in 2 hours. Shop your favorites now!"
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate({...newTemplate, message: e.target.value})}
                  maxLength={200}
                />
                <Form.Text className="text-muted">
                  {newTemplate.message.length}/200 characters
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Icon</Form.Label>
                <div className="mb-2">
                  <Form.Check
                    inline
                    type="radio"
                    label="Icon URL"
                    name="iconType"
                    checked={newTemplate.iconType === 'url'}
                    onChange={() => setNewTemplate({...newTemplate, iconType: 'url', icon: ''})}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label="Emoji"
                    name="iconType"
                    checked={newTemplate.iconType === 'emoji'}
                    onChange={() => setNewTemplate({...newTemplate, iconType: 'emoji', icon: ''})}
                  />
                </div>
                {newTemplate.iconType === 'url' ? (
                  <div>
                    <div className="d-flex gap-2 mb-2">
                      <Form.Control
                        type="url"
                        placeholder="https://example.com/icon.png (192x192px recommended)"
                        value={newTemplate.icon}
                        onChange={(e) => {
                          setNewTemplate({...newTemplate, icon: e.target.value})
                          setUploadedIcon(null)
                        }}
                        className="flex-grow-1"
                      />
                    </div>
                    <div className="d-flex align-items-center gap-3">
                      <span className="text-muted">OR</span>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIconUpload}
                          style={{ display: 'none' }}
                          id="icon-upload"
                        />
                        <label htmlFor="icon-upload" className="btn btn-outline-primary btn-sm mb-0">
                          Upload Icon
                        </label>
                        {uploadedIcon && (
                          <span className="ms-2 text-success small">
                            ✓ {uploadedIcon}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Form.Control
                    type="text"
                    placeholder="e.g., 🛍️ or 📦"
                    value={newTemplate.icon}
                    onChange={(e) => setNewTemplate({...newTemplate, icon: e.target.value})}
                    maxLength={2}
                  />
                )}
              </Form.Group>

              {/* Preview */}
              <div className="border rounded p-3 bg-light">
                <h6 className="mb-3">Preview</h6>
                <div className="d-flex align-items-start">
                  <div className="me-3">
                    {newTemplate.icon ? (
                      newTemplate.iconType === 'url' ? (
                        <img 
                          src={newTemplate.icon} 
                          alt="Icon preview" 
                          style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                          onError={(e) => e.target.src = 'https://via.placeholder.com/64'}
                        />
                      ) : (
                        <div style={{ 
                          width: '64px', 
                          height: '64px', 
                          fontSize: '2.5rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: '#e9ecef',
                          borderRadius: '8px'
                        }}>
                          {newTemplate.icon}
                        </div>
                      )
                    ) : (
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        backgroundColor: '#e9ecef',
                        borderRadius: '8px'
                      }} />
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <h6>{newTemplate.title || 'Notification Title'}</h6>
                    <p className="mb-0 text-muted small">
                      {newTemplate.message || 'Notification message will appear here'}
                    </p>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>
        {!creationSuccess && (
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name || !newTemplate.category || !newTemplate.title || !newTemplate.message}
            >
              Create Template
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      {/* Edit Template Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingTemplate && (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Template Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Weekend Sale"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category *</Form.Label>
                    <Form.Select
                      value={editingTemplate.category}
                      onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value})}
                    >
                      <option value="">Select category</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="content">Content</option>
                      <option value="engagement">Engagement</option>
                      <option value="transactional">Transactional</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Notification Title *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., ⚡ Flash Sale - 50% OFF Everything!"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({...editingTemplate, title: e.target.value})}
                  maxLength={65}
                />
                <Form.Text className="text-muted">
                  {editingTemplate.title.length}/65 characters
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notification Message *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="e.g., Hurry! Our biggest sale of the year ends in 2 hours. Shop your favorites now!"
                  value={editingTemplate.message}
                  onChange={(e) => setEditingTemplate({...editingTemplate, message: e.target.value})}
                  maxLength={200}
                />
                <Form.Text className="text-muted">
                  {editingTemplate.message.length}/200 characters
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Icon</Form.Label>
                <div className="d-flex gap-3 mb-2">
                  <Form.Check
                    type="radio"
                    label="Icon URL"
                    name="iconType"
                    value="url"
                    checked={editingTemplate.iconType === 'url'}
                    onChange={(e) => setEditingTemplate({...editingTemplate, iconType: e.target.value, icon: ''})}
                  />
                  <Form.Check
                    type="radio"
                    label="Emoji"
                    name="iconType"
                    value="emoji"
                    checked={editingTemplate.iconType === 'emoji'}
                    onChange={(e) => setEditingTemplate({...editingTemplate, iconType: e.target.value, icon: ''})}
                  />
                </div>
                
                {editingTemplate.iconType === 'url' ? (
                  <Form.Control
                    type="url"
                    placeholder="https://example.com/icon.png"
                    value={editingTemplate.icon}
                    onChange={(e) => setEditingTemplate({...editingTemplate, icon: e.target.value})}
                  />
                ) : (
                  <Form.Control
                    type="text"
                    placeholder="Enter an emoji, e.g., 🎉"
                    value={editingTemplate.icon}
                    onChange={(e) => setEditingTemplate({...editingTemplate, icon: e.target.value})}
                    maxLength={2}
                  />
                )}
              </Form.Group>

              {/* Preview */}
              <div className="bg-light rounded p-3">
                <small className="text-muted d-block mb-2">Preview</small>
                <div className="d-flex align-items-start gap-3">
                  <div style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                    {editingTemplate.icon && (editingTemplate.icon.startsWith('http') || editingTemplate.icon.startsWith('data:')) ? (
                      <img 
                        src={editingTemplate.icon} 
                        alt="Icon"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ fontSize: '32px' }}>{editingTemplate.icon || '📄'}</div>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <h6>{editingTemplate.title || 'Notification Title'}</h6>
                    <p className="mb-0 text-muted small">
                      {editingTemplate.message || 'Notification message will appear here'}
                    </p>
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateTemplate}
            disabled={!editingTemplate?.name || !editingTemplate?.category || !editingTemplate?.title || !editingTemplate?.message}
          >
            Update Template
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}