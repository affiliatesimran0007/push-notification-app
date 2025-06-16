'use client'

import { useState, useEffect } from 'react'
import { MDBCard, MDBCardBody, MDBSwitch } from 'mdb-react-ui-kit'
import { Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import { FiSend } from 'react-icons/fi'
import { FaWindows, FaApple, FaLinux, FaAndroid, FaChrome, FaFirefox, FaEdge, FaSafari, FaOpera } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { apiCall } from '@/lib/hooks/useApi'

export default function CampaignBuilder() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [currentISTTime, setCurrentISTTime] = useState('')
  const [landingPages, setLandingPages] = useState([])
  const [loadingLandingPages, setLoadingLandingPages] = useState(true)
  
  const [audienceOptions, setAudienceOptions] = useState([
    { value: 'all', label: 'All Subscribers' },
    { value: 'premium', label: 'Premium Users' },
    { value: 'cart', label: 'Cart Abandoners' },
    { value: 'newsletter', label: 'Newsletter Subscribers' },
    { value: 'mobile', label: 'Mobile Users' },
    { value: 'desktop', label: 'Desktop Users' },
  ])
  
  const [iconType, setIconType] = useState('url') // 'url' or 'upload'
  const [uploadedIcon, setUploadedIcon] = useState(null)
  
  const [campaignData, setCampaignData] = useState({
    id: null, // For editing existing drafts
    name: '',
    title: '',
    message: '',
    url: '',
    icon: '',
    image: '',
    button1Text: '',
    button1Url: '',
    button2Text: '',
    button2Url: '',
    targetAudience: null,
    targetBrowsers: {
      all: true,
      chrome: false,
      firefox: false,
      edge: false,
      safari: false,
      opera: false
    },
    targetSystems: {
      all: true,
      windows: false,
      macos: false,
      linux: false,
      android: false,
      ios: false
    },
    schedule: 'immediate',
    scheduledTime: new Date(),
  })

  // Fetch landing pages
  useEffect(() => {
    const fetchLandingPages = async () => {
      try {
        setLoadingLandingPages(true)
        const response = await apiCall('/api/landing')
        if (response && Array.isArray(response)) {
          setLandingPages(response)
          
          // Update audience options with landing pages
          const landingPageOptions = response.map(page => ({
            value: `landing:${page.landingId}`,
            label: `${page.name} (${page.subscribers} subscribers)`,
            subscribers: page.subscribers
          }))
          
          setAudienceOptions([
            { value: 'all', label: 'All Subscribers' },
            { value: 'divider-1', label: '──── Landing Pages ────', isDisabled: true },
            ...landingPageOptions,
            { value: 'divider-2', label: '──── Segments ────', isDisabled: true },
            { value: 'premium', label: 'Premium Users' },
            { value: 'cart', label: 'Cart Abandoners' },
            { value: 'newsletter', label: 'Newsletter Subscribers' },
            { value: 'mobile', label: 'Mobile Users' },
            { value: 'desktop', label: 'Desktop Users' },
          ])
        }
      } catch (error) {
        console.error('Error fetching landing pages:', error)
      } finally {
        setLoadingLandingPages(false)
      }
    }
    
    fetchLandingPages()
  }, [])

  // Update current IST time
  useEffect(() => {
    const updateISTTime = () => {
      const now = new Date()
      const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}))
      setCurrentISTTime(istTime.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        hour12: true
      }))
    }
    
    updateISTTime()
    const interval = setInterval(updateISTTime, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Load template data or draft data from sessionStorage if available
  useEffect(() => {
    setIsMounted(true)
    
    // Check for draft data first
    const draftData = sessionStorage.getItem('editDraft')
    if (draftData) {
      const draft = JSON.parse(draftData)
      
      // Extract button data from variantA actions if available
      let button1Text = '', button1Url = '', button2Text = '', button2Url = ''
      if (draft.variantA?.actions) {
        const actions = draft.variantA.actions
        const button1 = actions.find(a => a.action === 'button1')
        const button2 = actions.find(a => a.action === 'button2')
        if (button1) {
          button1Text = button1.title
          button1Url = button1.url
        }
        if (button2) {
          button2Text = button2.title
          button2Url = button2.url
        }
      }
      
      setCampaignData(prev => ({
        ...prev,
        id: draft.id, // Store the draft ID
        name: draft.name,
        title: draft.title || '',
        message: draft.message || '',
        icon: draft.icon || '',
        url: draft.url || '',
        image: draft.image || '',
        button1Text,
        button1Url,
        button2Text,
        button2Url,
        targetAudience: draft.targetAudience,  // Store the value, we'll resolve it later
        targetBrowsers: draft.variantA?.targetBrowsers || {
          all: true,
          chrome: false,
          firefox: false,
          edge: false,
          safari: false,
          opera: false
        },
        targetSystems: draft.variantA?.targetSystems || {
          all: true,
          windows: false,
          macos: false,
          linux: false,
          android: false,
          ios: false
        },
        schedule: draft.scheduledFor ? 'scheduled' : 'immediate',
        scheduledTime: draft.scheduledFor ? new Date(draft.scheduledFor) : new Date()
      }))
      sessionStorage.removeItem('editDraft')
    } else {
      // Check for template data
      const templateData = sessionStorage.getItem('selectedTemplate')
      if (templateData) {
        const template = JSON.parse(templateData)
        
        // Check if icon is base64 or URL
        if (template.icon && template.icon.startsWith('data:')) {
          setIconType('upload')
          setUploadedIcon(template.icon)
        } else if (template.icon) {
          setIconType('url')
        }
        
        setCampaignData(prev => ({
          ...prev,
          name: template.name + ' Campaign',
          title: template.title,
          message: template.message,
          icon: template.icon || '',
          url: template.url || '',
          image: template.image || ''
        }))
        sessionStorage.removeItem('selectedTemplate')
      }
    }
  }, [])

  // Resolve target audience when audience options are loaded
  useEffect(() => {
    if (campaignData.targetAudience && typeof campaignData.targetAudience === 'string' && audienceOptions.length > 0) {
      const selectedOption = audienceOptions.find(opt => opt.value === campaignData.targetAudience)
      if (selectedOption) {
        setCampaignData(prev => ({
          ...prev,
          targetAudience: selectedOption
        }))
      }
    }
  }, [audienceOptions])

  const handleIconUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setUploadedIcon(base64String)
        setCampaignData({...campaignData, icon: base64String})
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields (less strict for drafts)
      if (!isDraft && (!campaignData.name || !campaignData.title || !campaignData.message)) {
        throw new Error('Please fill in all required fields')
      }

      if (isDraft && !campaignData.name) {
        throw new Error('Please provide a campaign name for the draft')
      }

      // Convert scheduled time to IST if scheduling
      let scheduledForIST = null
      if (campaignData.schedule === 'scheduled') {
        // The user selects time assuming it's IST, but DatePicker gives us local time
        // We need to convert it to IST (UTC+5:30)
        const selectedDate = new Date(campaignData.scheduledTime)
        
        // Get the user's timezone offset in minutes
        const userOffset = selectedDate.getTimezoneOffset()
        
        // IST is UTC+5:30, which is -330 minutes offset
        const istOffset = -330
        
        // Calculate the difference between user timezone and IST
        const offsetDiff = userOffset - istOffset
        
        // Adjust the time to IST
        const istDate = new Date(selectedDate.getTime() - (offsetDiff * 60 * 1000))
        
        scheduledForIST = istDate.toISOString()
      }

      const payload = {
        name: campaignData.name,
        title: campaignData.title,
        message: campaignData.message,
        url: campaignData.url || '',
        icon: campaignData.icon && campaignData.icon.trim() !== '' ? campaignData.icon : undefined,
        image: campaignData.image || '',
        targetAudience: campaignData.targetAudience?.value || 'all',
        targetBrowsers: campaignData.targetBrowsers,
        targetSystems: campaignData.targetSystems,
        status: isDraft ? 'draft' : (campaignData.schedule === 'scheduled' ? 'scheduled' : 'active'),
        scheduledFor: scheduledForIST,
        button1Text: campaignData.button1Text || '',
        button1Url: campaignData.button1Url || '',
        button2Text: campaignData.button2Text || '',
        button2Url: campaignData.button2Url || ''
      }

      // Use PUT for updating existing draft, POST for creating new
      const response = await apiCall(
        campaignData.id ? `/api/campaigns?id=${campaignData.id}` : '/api/campaigns',
        {
          method: campaignData.id ? 'PUT' : 'POST',
          body: JSON.stringify(payload)
        }
      )

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

                  <h6 className="mb-3">Action Buttons (Optional)</h6>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Button 1 Text</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="e.g., Shop Now"
                          value={campaignData.button1Text}
                          onChange={(e) => setCampaignData({...campaignData, button1Text: e.target.value})}
                          maxLength={25}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Button 1 URL</Form.Label>
                        <Form.Control 
                          type="url" 
                          placeholder="https://example.com/shop"
                          value={campaignData.button1Url}
                          onChange={(e) => setCampaignData({...campaignData, button1Url: e.target.value})}
                          disabled={!campaignData.button1Text}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Button 2 Text</Form.Label>
                        <Form.Control 
                          type="text" 
                          placeholder="e.g., Learn More"
                          value={campaignData.button2Text}
                          onChange={(e) => setCampaignData({...campaignData, button2Text: e.target.value})}
                          maxLength={25}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Button 2 URL</Form.Label>
                        <Form.Control 
                          type="url" 
                          placeholder="https://example.com/learn"
                          value={campaignData.button2Url}
                          onChange={(e) => setCampaignData({...campaignData, button2Url: e.target.value})}
                          disabled={!campaignData.button2Text}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Notification Icon</Form.Label>
                        <div className="d-flex gap-3 mb-2">
                          <Form.Check
                            type="radio"
                            label="Icon URL"
                            name="iconType"
                            value="url"
                            checked={iconType === 'url'}
                            onChange={(e) => {
                              setIconType(e.target.value)
                              setUploadedIcon(null)
                              setCampaignData({...campaignData, icon: ''})
                            }}
                          />
                          <Form.Check
                            type="radio"
                            label="Upload Icon"
                            name="iconType"
                            value="upload"
                            checked={iconType === 'upload'}
                            onChange={(e) => {
                              setIconType(e.target.value)
                              setCampaignData({...campaignData, icon: ''})
                            }}
                          />
                        </div>
                        
                        {iconType === 'url' ? (
                          <Form.Control 
                            type="url" 
                            placeholder="https://example.com/icon.png"
                            value={campaignData.icon}
                            onChange={(e) => setCampaignData({...campaignData, icon: e.target.value})}
                          />
                        ) : (
                          <div>
                            <Form.Control
                              type="file"
                              accept="image/*"
                              onChange={handleIconUpload}
                              className="mb-2"
                            />
                            {uploadedIcon && (
                              <div className="mt-2">
                                <img 
                                  src={uploadedIcon} 
                                  alt="Uploaded icon" 
                                  style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                                />
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="text-danger ms-2"
                                  onClick={() => {
                                    setUploadedIcon(null)
                                    setCampaignData({...campaignData, icon: ''})
                                  }}
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        <Form.Text className="text-muted">
                          Recommended size: 192x192px
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Hero Image URL (Optional)</Form.Label>
                        <Form.Control 
                          type="url" 
                          placeholder="https://example.com/image.jpg"
                          value={campaignData.image}
                          onChange={(e) => setCampaignData({...campaignData, image: e.target.value})}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-4" />

                  <h5 className="mb-3">Targeting & Scheduling</h5>

                  <Form.Group className="mb-3">
                    <Form.Label>Target Audience</Form.Label>
                    {isMounted && (
                      <Select
                        options={audienceOptions}
                        value={campaignData.targetAudience}
                        onChange={(value) => setCampaignData({...campaignData, targetAudience: value})}
                        placeholder={loadingLandingPages ? "Loading audiences..." : "Select target audience"}
                        isLoading={loadingLandingPages}
                        isDisabled={loadingLandingPages}
                        formatOptionLabel={(option) => (
                          <div>
                            <span>{option.label}</span>
                            {option.value.startsWith('landing:') && (
                              <small className="text-muted ms-2">Landing Page</small>
                            )}
                          </div>
                        )}
                      />
                    )}
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Target Browsers</Form.Label>
                        <div className="border rounded p-3">
                          <Form.Check
                            type="checkbox"
                            id="browser-all"
                            label="All Browsers"
                            checked={campaignData.targetBrowsers.all}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setCampaignData({
                                ...campaignData,
                                targetBrowsers: {
                                  all: checked,
                                  chrome: false,
                                  firefox: false,
                                  edge: false,
                                  safari: false,
                                  opera: false
                                }
                              })
                            }}
                          />
                          <hr className="my-2" />
                          <Form.Check
                            type="checkbox"
                            id="browser-chrome"
                            label={<span><FaChrome className="text-info me-2" />Chrome</span>}
                            checked={campaignData.targetBrowsers.chrome}
                            disabled={campaignData.targetBrowsers.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetBrowsers: {...campaignData.targetBrowsers, chrome: e.target.checked}
                            })}
                          />
                          <Form.Check
                            type="checkbox"
                            id="browser-firefox"
                            label={<span><FaFirefox className="text-warning me-2" />Firefox</span>}
                            checked={campaignData.targetBrowsers.firefox}
                            disabled={campaignData.targetBrowsers.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetBrowsers: {...campaignData.targetBrowsers, firefox: e.target.checked}
                            })}
                          />
                          <Form.Check
                            type="checkbox"
                            id="browser-edge"
                            label={<span><FaEdge className="text-primary me-2" />Edge</span>}
                            checked={campaignData.targetBrowsers.edge}
                            disabled={campaignData.targetBrowsers.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetBrowsers: {...campaignData.targetBrowsers, edge: e.target.checked}
                            })}
                          />
                          <Form.Check
                            type="checkbox"
                            id="browser-safari"
                            label={<span><FaSafari className="text-secondary me-2" />Safari</span>}
                            checked={campaignData.targetBrowsers.safari}
                            disabled={campaignData.targetBrowsers.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetBrowsers: {...campaignData.targetBrowsers, safari: e.target.checked}
                            })}
                          />
                          <Form.Check
                            type="checkbox"
                            id="browser-opera"
                            label={<span><FaOpera className="text-danger me-2" />Opera</span>}
                            checked={campaignData.targetBrowsers.opera}
                            disabled={campaignData.targetBrowsers.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetBrowsers: {...campaignData.targetBrowsers, opera: e.target.checked}
                            })}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Target Systems</Form.Label>
                        <div className="border rounded p-3">
                          <Form.Check
                            type="checkbox"
                            id="system-all"
                            label="All Systems"
                            checked={campaignData.targetSystems.all}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setCampaignData({
                                ...campaignData,
                                targetSystems: {
                                  all: checked,
                                  windows: false,
                                  macos: false,
                                  linux: false,
                                  android: false,
                                  ios: false
                                }
                              })
                            }}
                          />
                          <hr className="my-2" />
                          <Form.Check
                            type="checkbox"
                            id="system-windows"
                            label={<span><FaWindows className="text-info me-2" />Windows</span>}
                            checked={campaignData.targetSystems.windows}
                            disabled={campaignData.targetSystems.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetSystems: {...campaignData.targetSystems, windows: e.target.checked}
                            })}
                          />
                          <Form.Check
                            type="checkbox"
                            id="system-macos"
                            label={<span><FaApple className="text-dark me-2" />macOS</span>}
                            checked={campaignData.targetSystems.macos}
                            disabled={campaignData.targetSystems.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetSystems: {...campaignData.targetSystems, macos: e.target.checked}
                            })}
                          />
                          <Form.Check
                            type="checkbox"
                            id="system-linux"
                            label={<span><FaLinux className="text-warning me-2" />Linux</span>}
                            checked={campaignData.targetSystems.linux}
                            disabled={campaignData.targetSystems.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetSystems: {...campaignData.targetSystems, linux: e.target.checked}
                            })}
                          />
                          <Form.Check
                            type="checkbox"
                            id="system-android"
                            label={<span><FaAndroid className="text-success me-2" />Android</span>}
                            checked={campaignData.targetSystems.android}
                            disabled={campaignData.targetSystems.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetSystems: {...campaignData.targetSystems, android: e.target.checked}
                            })}
                          />
                          <Form.Check
                            type="checkbox"
                            id="system-ios"
                            label={<span><FaApple className="text-dark me-2" />iOS</span>}
                            checked={campaignData.targetSystems.ios}
                            disabled={campaignData.targetSystems.all}
                            onChange={(e) => setCampaignData({
                              ...campaignData,
                              targetSystems: {...campaignData.targetSystems, ios: e.target.checked}
                            })}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

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

                  {campaignData.schedule === 'scheduled' && isMounted && (
                    <Form.Group className="mb-3">
                      <Form.Label>Schedule Date & Time (IST - India Standard Time)</Form.Label>
                      <DatePicker
                        selected={campaignData.scheduledTime}
                        onChange={(date) => setCampaignData({...campaignData, scheduledTime: date})}
                        showTimeSelect
                        dateFormat="MMMM d, yyyy h:mm aa"
                        className="form-control"
                        minDate={new Date()}
                        placeholderText="Select date and time in IST"
                      />
                      <Form.Text className="text-muted d-block">
                        Current IST time: {currentISTTime}
                      </Form.Text>
                      <Form.Text className="text-muted">
                        Notifications will be sent at the scheduled time in IST (UTC+5:30)
                      </Form.Text>
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
                    <Button 
                      variant="secondary" 
                      disabled={isSubmitting}
                      onClick={(e) => handleSubmit(e, true)}
                    >
                      Save as Draft
                    </Button>
                  </div>
                </Form>
              </MDBCardBody>
            </MDBCard>
          </Col>

          <Col lg={4}>
            <div className="position-sticky" style={{ top: '20px' }}>
              <h5 className="mb-3">Preview</h5>
              <MDBCard className="shadow-sm">
                <MDBCardBody className="p-3">
                  {/* Notification Preview */}
                  <div className="notification-preview">
                    <div className="border rounded p-3">
                      <div className="d-flex align-items-start">
                        {campaignData.icon ? (
                          <img 
                            src={campaignData.icon} 
                            alt="Icon" 
                            className="rounded me-3"
                            width="48"
                            height="48"
                            style={{ objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/48'
                            }}
                          />
                        ) : (
                          <div 
                            className="rounded me-3 bg-light d-flex align-items-center justify-content-center"
                            style={{ width: '48px', height: '48px' }}
                          >
                            <span className="text-muted">Icon</span>
                          </div>
                        )}
                        <div className="flex-grow-1">
                          <h6 className="mb-1">
                            {campaignData.title || 'Notification Title'}
                          </h6>
                          <p className="mb-0 text-muted small">
                            {campaignData.message || 'Notification message will appear here'}
                          </p>
                          {(campaignData.button1Text || campaignData.button2Text) && (
                            <div className="mt-2">
                              {campaignData.button1Text && (
                                <button className="btn btn-sm btn-primary me-2">
                                  {campaignData.button1Text}
                                </button>
                              )}
                              {campaignData.button2Text && (
                                <button className="btn btn-sm btn-outline-primary">
                                  {campaignData.button2Text}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {campaignData.image && (
                      <div className="mt-3">
                        <small className="text-muted d-block mb-2">Hero Image:</small>
                        <img 
                          src={campaignData.image} 
                          alt="Hero" 
                          className="img-fluid rounded"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </MDBCardBody>
              </MDBCard>
            </div>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}