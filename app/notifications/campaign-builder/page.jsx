'use client'

import { useState } from 'react'
import { MDBCard, MDBCardBody, MDBSwitch } from 'mdb-react-ui-kit'
import { Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import { FiSend, FiCopy, FiPercent } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { apiCall } from '@/lib/hooks/useApi'

export default function CampaignBuilder() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [campaignData, setCampaignData] = useState({
    name: '',
    title: '',
    message: '',
    url: '',
    icon: '',
    image: '',
    targetAudience: null,
    schedule: 'immediate',
    scheduledTime: new Date(),
    enableABTest: false,
    variantB: {
      title: '',
      message: '',
      url: '',
    },
    trafficSplit: 50,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      if (!campaignData.name || !campaignData.title || !campaignData.message) {
        throw new Error('Please fill in all required fields')
      }

      const payload = {
        name: campaignData.name,
        title: campaignData.title,
        message: campaignData.message,
        url: campaignData.url || '/',
        icon: campaignData.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        targetAudience: campaignData.targetAudience?.value || 'all',
        scheduledFor: campaignData.schedule === 'scheduled' ? campaignData.scheduledTime.toISOString() : null,
        abTest: campaignData.enableABTest ? {
          enabled: true,
          variantA: {
            title: campaignData.title,
            message: campaignData.message,
            url: campaignData.url
          },
          variantB: campaignData.variantB,
          trafficSplit: campaignData.trafficSplit
        } : {
          enabled: false,
          variantA: null,
          variantB: null,
          trafficSplit: 50
        }
      }

      const response = await apiCall('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (response.success) {
        // Redirect to campaigns page
        router.push('/notifications/campaigns')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const audienceOptions = [
    { value: 'all', label: 'All Subscribers' },
    { value: 'premium', label: 'Premium Users' },
    { value: 'cart', label: 'Cart Abandoners' },
    { value: 'newsletter', label: 'Newsletter Subscribers' },
    { value: 'mobile', label: 'Mobile Users' },
    { value: 'desktop', label: 'Desktop Users' },
  ]

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h1 className="h3 mb-4">Campaign Builder</h1>

        <Row>
          <Col lg={8}>
            <MDBCard className="shadow-sm">
              <MDBCardBody>
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                <Form onSubmit={handleSubmit}>
                  <h5 className="mb-3">Campaign Details</h5>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Campaign Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      placeholder="Enter campaign name"
                      value={campaignData.name}
                      onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Title (Max 50 characters) <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="Notification title"
                          value={campaignData.title}
                          onChange={(e) => setCampaignData({...campaignData, title: e.target.value})}
                          maxLength={50}
                          required
                        />
                        <small className="text-muted">{campaignData.title.length}/50</small>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Landing URL</Form.Label>
                        <Form.Control 
                          type="url" 
                          placeholder="https://example.com"
                          value={campaignData.url}
                          onChange={(e) => setCampaignData({...campaignData, url: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Message (Max 125 characters) <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      as="textarea" 
                      rows={3} 
                      placeholder="Notification message"
                      value={campaignData.message}
                      onChange={(e) => setCampaignData({...campaignData, message: e.target.value})}
                      maxLength={125}
                      required
                    />
                    <small className="text-muted">{campaignData.message.length}/125</small>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Icon (192x192px)</Form.Label>
                        <Form.Control type="file" accept="image/*" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Hero Image (720x480px) - Optional</Form.Label>
                        <Form.Control type="file" accept="image/*" />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-4" />

                  <h5 className="mb-3">A/B Testing</h5>

                  <MDBSwitch 
                    id="enableABTest" 
                    label="Enable A/B Testing" 
                    checked={campaignData.enableABTest}
                    onChange={(e) => setCampaignData({...campaignData, enableABTest: e.target.checked})}
                    className="mb-3"
                  />

                  {campaignData.enableABTest && (
                    <div className="border rounded p-3 mb-4 bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Variant B</h6>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            setCampaignData({
                              ...campaignData,
                              variantB: {
                                title: campaignData.title,
                                message: campaignData.message,
                                url: campaignData.url,
                              }
                            })
                          }}
                        >
                          <FiCopy className="me-1" /> Copy from A
                        </Button>
                      </div>
                      
                      <Form.Group className="mb-2">
                        <Form.Label>Title (Variant B)</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="Alternative title"
                          value={campaignData.variantB.title}
                          onChange={(e) => setCampaignData({
                            ...campaignData, 
                            variantB: {...campaignData.variantB, title: e.target.value}
                          })}
                          maxLength={50}
                        />
                      </Form.Group>

                      <Form.Group className="mb-2">
                        <Form.Label>Message (Variant B)</Form.Label>
                        <Form.Control 
                          as="textarea" 
                          rows={2} 
                          placeholder="Alternative message"
                          value={campaignData.variantB.message}
                          onChange={(e) => setCampaignData({
                            ...campaignData, 
                            variantB: {...campaignData.variantB, message: e.target.value}
                          })}
                          maxLength={125}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>URL (Variant B)</Form.Label>
                        <Form.Control 
                          type="url" 
                          placeholder="Alternative URL (optional)"
                          value={campaignData.variantB.url}
                          onChange={(e) => setCampaignData({
                            ...campaignData, 
                            variantB: {...campaignData.variantB, url: e.target.value}
                          })}
                        />
                      </Form.Group>

                      <Form.Group>
                        <Form.Label className="d-flex align-items-center">
                          <FiPercent className="me-2" />
                          Traffic Split: {campaignData.trafficSplit}% / {100 - campaignData.trafficSplit}%
                        </Form.Label>
                        <Form.Range
                          min="10"
                          max="90"
                          step="10"
                          value={campaignData.trafficSplit}
                          onChange={(e) => setCampaignData({...campaignData, trafficSplit: parseInt(e.target.value)})}
                        />
                        <div className="d-flex justify-content-between small text-muted">
                          <span>Variant A: {campaignData.trafficSplit}%</span>
                          <span>Variant B: {100 - campaignData.trafficSplit}%</span>
                        </div>
                      </Form.Group>
                    </div>
                  )}

                  <hr className="my-4" />

                  <h5 className="mb-3">Targeting & Scheduling</h5>

                  <Form.Group className="mb-3">
                    <Form.Label>Target Audience</Form.Label>
                    <Select
                      options={audienceOptions}
                      value={campaignData.targetAudience}
                      onChange={(value) => setCampaignData({...campaignData, targetAudience: value})}
                      placeholder="Select target audience"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Schedule</Form.Label>
                    <div>
                      <Form.Check
                        type="radio"
                        id="immediate"
                        label="Send immediately"
                        checked={campaignData.schedule === 'immediate'}
                        onChange={() => setCampaignData({...campaignData, schedule: 'immediate'})}
                      />
                      <Form.Check
                        type="radio"
                        id="scheduled"
                        label="Schedule for later"
                        checked={campaignData.schedule === 'scheduled'}
                        onChange={() => setCampaignData({...campaignData, schedule: 'scheduled'})}
                      />
                    </div>
                  </Form.Group>

                  {campaignData.schedule === 'scheduled' && (
                    <Form.Group className="mb-3">
                      <Form.Label>Schedule Date & Time</Form.Label>
                      <DatePicker
                        selected={campaignData.scheduledTime}
                        onChange={(date) => setCampaignData({...campaignData, scheduledTime: date})}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="form-control"
                      />
                    </Form.Group>
                  )}

                  <div className="d-flex gap-2">
                    <Button 
                      type="submit" 
                      variant="primary" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <FiSend className="me-2" />
                          {campaignData.schedule === 'immediate' ? 'Send Now' : 'Schedule Campaign'}
                        </>
                      )}
                    </Button>
                    <Button variant="secondary" disabled={isSubmitting}>Save as Draft</Button>
                  </div>
                </Form>
              </MDBCardBody>
            </MDBCard>
          </Col>

          <Col lg={4}>
            <div className="position-sticky" style={{ top: '20px' }}>
              <MDBCard className="shadow-sm">
                <MDBCardBody>
                  <h5 className="mb-3">Preview</h5>
                  
                  {/* Variant A Preview */}
                  <div className="notification-preview mb-3">
                    {campaignData.enableABTest && (
                      <div className="d-flex align-items-center mb-2">
                        <span className="badge bg-primary me-2">A</span>
                        <small className="text-muted">Variant A ({campaignData.trafficSplit}%)</small>
                      </div>
                    )}
                    <div className="border rounded p-3">
                      <div className="d-flex align-items-start">
                        <img 
                          src="https://via.placeholder.com/48" 
                          alt="Icon" 
                          className="rounded me-3"
                          width="48"
                          height="48"
                        />
                        <div className="flex-grow-1">
                          <h6 className="mb-1">
                            {campaignData.title || 'Notification Title'}
                          </h6>
                          <p className="mb-0 text-muted small">
                            {campaignData.message || 'Notification message will appear here'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Variant B Preview */}
                  {campaignData.enableABTest && (
                    <div className="notification-preview">
                      <div className="d-flex align-items-center mb-2">
                        <span className="badge bg-success me-2">B</span>
                        <small className="text-muted">Variant B ({100 - campaignData.trafficSplit}%)</small>
                      </div>
                      <div className="border rounded p-3">
                        <div className="d-flex align-items-start">
                          <img 
                            src="https://via.placeholder.com/48" 
                            alt="Icon" 
                            className="rounded me-3"
                            width="48"
                            height="48"
                          />
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              {campaignData.variantB.title || 'Alternative Title'}
                            </h6>
                            <p className="mb-0 text-muted small">
                              {campaignData.variantB.message || 'Alternative message will appear here'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {campaignData.enableABTest && (
                    <Alert variant="info" className="mt-3 small">
                      <FiPercent className="me-1" />
                      Traffic will be split between both variants. Performance metrics will be tracked separately.
                    </Alert>
                  )}
                </MDBCardBody>
              </MDBCard>
            </div>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}