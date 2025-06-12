'use client'

import { useState, useEffect } from 'react'
import './clients.css'
import './dropdown-fix.css'
import { 
  MDBCard, 
  MDBCardBody, 
  MDBTable, 
  MDBTableHead, 
  MDBTableBody,
  MDBBtn,
  MDBBadge,
  MDBInput,
  MDBIcon,
  MDBTooltip,
  MDBDropdown,
  MDBDropdownToggle,
  MDBDropdownMenu,
  MDBDropdownItem
} from 'mdb-react-ui-kit'
import { Row, Col, Form, Modal, Button, Card, Spinner, Alert } from 'react-bootstrap'
import Select from 'react-select'
import { FiSend, FiTrash2, FiFilter, FiDownload, FiSearch, FiMoreVertical, FiChrome, FiGlobe, FiUsers, FiSmartphone, FiMonitor, FiStar, FiChevronRight, FiCheckCircle, FiTool } from 'react-icons/fi'
import { SiFirefox, SiSafari, SiGooglechrome, SiMicrosoftedge } from 'react-icons/si'
import { RiEdgeLine } from 'react-icons/ri'
import DashboardLayout from '@/components/DashboardLayout'
import { useApi, apiCall } from '@/lib/hooks/useApi'

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState({
    browser: null,
    country: null,
    deviceType: null,
  })
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sendingNotification, setSendingNotification] = useState(false)
  const [notificationSuccess, setNotificationSuccess] = useState(false)
  const [showNewClientAlert, setShowNewClientAlert] = useState(false)
  const [newClientIds, setNewClientIds] = useState(new Set())
  const [selectedClients, setSelectedClients] = useState(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false)
  const [diagnosticResults, setDiagnosticResults] = useState(null)
  const [runningDiagnostics, setRunningDiagnostics] = useState(false)

  // Build API URL with query params
  const buildApiUrl = () => {
    const params = new URLSearchParams()
    params.append('page', currentPage)
    params.append('limit', '10')
    if (searchTerm) params.append('search', searchTerm)
    if (selectedFilters.browser?.value) params.append('browser', selectedFilters.browser.value)
    if (selectedFilters.country?.value) params.append('country', selectedFilters.country.value)
    if (selectedFilters.deviceType?.value) params.append('device', selectedFilters.deviceType.value)
    return `/api/clients?${params.toString()}`
  }

  const { data, loading, error, refetch } = useApi(buildApiUrl())

  useEffect(() => {
    setMounted(true)
  }, [])

  // Real-time updates using Server-Sent Events
  useEffect(() => {
    let eventSource = null
    
    const connectSSE = () => {
      eventSource = new EventSource('/api/clients/stream')
      
      eventSource.onopen = () => {
        console.log('SSE connection established')
      }
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'new-client':
            // Refresh the client list when a new client is added
            refetch()
            setShowNewClientAlert(true)
            setTimeout(() => setShowNewClientAlert(false), 5000)
            
            // Add the new client ID to highlight it
            if (data.client && data.client.id) {
              setNewClientIds(prev => new Set([...prev, data.client.id]))
              
              // Remove highlight after 5 seconds
              setTimeout(() => {
                setNewClientIds(prev => {
                  const newSet = new Set(prev)
                  newSet.delete(data.client.id)
                  return newSet
                })
              }, 5000)
            }
            break
            
          case 'client-deleted':
          case 'client-updated':
            // Refresh the client list when a client is updated or deleted
            refetch()
            break
            
          case 'connected':
            console.log('Connected to real-time updates')
            break
            
          case 'heartbeat':
            // Keep connection alive
            break
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        eventSource.close()
        
        // Reconnect after 5 seconds
        setTimeout(() => {
          console.log('Attempting to reconnect SSE...')
          connectSSE()
        }, 5000)
      }
    }
    
    // Only connect on client side
    if (typeof window !== 'undefined') {
      connectSSE()
    }
    
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [refetch])


  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedFilters])

  // Filter options
  const browserOptions = [
    { value: 'chrome', label: 'Chrome' },
    { value: 'safari', label: 'Safari' },
    { value: 'firefox', label: 'Firefox' },
    { value: 'edge', label: 'Edge' },
  ]

  const countryOptions = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
  ]

  const deviceOptions = [
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' },
  ]

  // Get clients from API response
  const clients = data?.clients || []
  const pagination = data?.pagination || { total: 0, totalPages: 0 }

  const handleSendNotification = (client) => {
    setSelectedClient(client)
    setShowSendModal(true)
  }

  const handleSendTestNotification = async () => {
    if (!selectedClient) return
    
    setSendingNotification(true)
    setNotificationSuccess(false)
    
    try {
      console.log('Sending test notification to client:', selectedClient.id)
      console.log('Client details:', {
        browser: selectedClient.browser,
        device: selectedClient.device,
        endpoint: selectedClient.endpoint?.substring(0, 50) + '...'
      })
      
      const response = await apiCall('/api/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          clientIds: [selectedClient.id],
          notification: {
            title: 'Test Notification',
            message: `Test from Push Clients at ${new Date().toLocaleTimeString()}`,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            url: '/',
            tag: `client-test-${Date.now()}`, // Unique tag to prevent replacement
            campaignId: 'test',
            requireInteraction: false
          },
          testMode: true
        })
      })
      
      console.log('Notification send response:', response)
      
      if (response.sent > 0) {
        setNotificationSuccess(true)
        setTimeout(() => {
          setShowSendModal(false)
          setNotificationSuccess(false)
        }, 2000)
      } else {
        // Debug: Show full response
        console.error('Notification failed. Full response:', response)
        
        let debugInfo = {
          sent: response.sent,
          failed: response.failed,
          expired: response.expired,
          results: response.results || [],
          error: response.error || 'Unknown error'
        }
        
        // Show detailed error in alert
        alert(`Notification Error Debug:\n\n${JSON.stringify(debugInfo, null, 2)}`)
        
        throw new Error(`Notification failed: ${response.failed} failed, ${response.expired} expired`)
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      console.error('Error details:', error.response || error)
      
      // Provide more helpful error messages
      let errorMessage = error.message
      if (error.response?.details) {
        errorMessage += ` - ${error.response.details}`
      }
      if (error.response?.hint) {
        errorMessage += ` (${error.response.hint})`
      }
      
      alert('Failed to send notification: ' + errorMessage)
    } finally {
      setSendingNotification(false)
    }
  }

  const handleDeleteClient = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    try {
      await apiCall(`/api/clients?id=${clientId}`, {
        method: 'DELETE'
      })
      refetch()
    } catch (error) {
      console.error('Failed to delete client:', error)
      alert('Failed to delete client: ' + error.message)
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedClients(new Set(clients.map(c => c.id)))
    } else {
      setSelectedClients(new Set())
    }
  }

  const handleSelectClient = (clientId, checked) => {
    const newSelected = new Set(selectedClients)
    if (checked) {
      newSelected.add(clientId)
    } else {
      newSelected.delete(clientId)
    }
    setSelectedClients(newSelected)
  }

  const handleDiagnoseClient = async (client) => {
    setSelectedClient(client)
    setShowDiagnosticModal(true)
    setRunningDiagnostics(true)
    setDiagnosticResults(null)
    
    try {
      const response = await apiCall('/api/notifications/diagnose', {
        method: 'POST',
        body: JSON.stringify({ clientId: client.id })
      })
      
      setDiagnosticResults(response.diagnostics)
    } catch (error) {
      console.error('Failed to run diagnostics:', error)
      setDiagnosticResults({
        error: error.message || 'Failed to run diagnostics'
      })
    } finally {
      setRunningDiagnostics(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedClients.size === 0) return
    
    const confirmMsg = `Are you sure you want to delete ${selectedClients.size} selected client${selectedClients.size > 1 ? 's' : ''}?`
    if (!confirm(confirmMsg)) return
    
    setIsDeleting(true)
    let successCount = 0
    let failedCount = 0
    
    try {
      // Delete each client individually to handle partial failures
      for (const clientId of Array.from(selectedClients)) {
        try {
          await apiCall(`/api/clients?id=${clientId}`, { method: 'DELETE' })
          successCount++
        } catch (error) {
          console.error(`Failed to delete client ${clientId}:`, error)
          failedCount++
        }
      }
      
      // Clear selection and refresh
      setSelectedClients(new Set())
      refetch()
      
      // Show result
      if (failedCount > 0) {
        alert(`Deleted ${successCount} clients. Failed to delete ${failedCount} clients.`)
      } else {
        console.log(`Successfully deleted ${successCount} clients`)
      }
    } catch (error) {
      console.error('Unexpected error during bulk delete:', error)
      alert('An unexpected error occurred: ' + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const getFlagEmoji = (country) => {
    const flags = {
      'United States': '🇺🇸',
      'Canada': '🇨🇦',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
    }
    return flags[country] || '🌍'
  }

  const formatIP = (ip) => {
    if (!ip || ip === 'unknown') return 'Unknown IP'
    if (ip === '::1') return 'localhost (IPv6)'
    if (ip === '127.0.0.1') return 'localhost (IPv4)'
    return ip
  }

  const getDeviceIcon = (device) => {
    const icons = {
      desktop: 'desktop',
      mobile: 'mobile-alt',
      tablet: 'tablet-alt',
    }
    return icons[device] || 'desktop'
  }

  const getBrowserIcon = (browser) => {
    const browserName = browser.toLowerCase()
    switch(browserName) {
      case 'chrome':
        return <SiGooglechrome size={20} className="text-primary me-2" />
      case 'firefox':
        return <SiFirefox size={20} className="text-warning me-2" />
      case 'safari':
        return <SiSafari size={20} className="text-info me-2" />
      case 'edge':
        return <RiEdgeLine size={20} className="text-primary me-2" />
      default:
        return <FiGlobe size={20} className="text-secondary me-2" />
    }
  }

  const [showSegmentModal, setShowSegmentModal] = useState(false)
  // Calculate real segments from client data
  const segments = [
    { id: 1, name: 'Active Users', count: clients.length, color: 'success', icon: FiUsers },
    { id: 2, name: 'Mobile Users', count: clients.filter(c => c.device === 'mobile').length, color: 'info', icon: FiSmartphone },
    { id: 3, name: 'Desktop Users', count: clients.filter(c => c.device === 'desktop').length, color: 'primary', icon: FiMonitor },
    { id: 4, name: 'Browser Types', count: new Set(clients.map(c => c.browser)).size, color: 'warning', icon: FiStar },
  ]

  return (
    <DashboardLayout>
      <div className="mb-4">
        {/* New Client Alert */}
        {showNewClientAlert && (
          <Alert variant="success" className="mb-3 d-flex align-items-center">
            <FiCheckCircle className="me-2" />
            <strong>New client subscribed!</strong> The list has been automatically updated.
          </Alert>
        )}
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <h1 className="h3 mb-0">Push Clients</h1>
            {loading && clients.length > 0 && (
              <Spinner animation="border" size="sm" className="ms-3 text-primary" />
            )}
          </div>
          <div className="d-flex gap-2">
            {selectedClients.size > 0 && (
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="me-2" />
                    Delete ({selectedClients.size})
                  </>
                )}
              </Button>
            )}
            <Button variant="outline-primary" size="sm" onClick={() => setShowSegmentModal(true)}>
              <FiFilter className="me-2" />
              Create Segment
            </Button>
            <MDBBtn color="primary" size="sm">
              <MDBIcon fas icon="download" className="me-2" />
              Export
            </MDBBtn>
          </div>
        </div>

        {/* Segments Row */}
        <Row className="mb-4">
          {segments.map((segment) => {
            const Icon = segment.icon
            return (
              <Col md={3} key={segment.id} className="mb-3">
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body className="d-flex align-items-center">
                    <div className={`p-3 rounded-circle bg-${segment.color} bg-opacity-10 me-3`}>
                      <Icon size={24} className={`text-${segment.color}`} />
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-0">{segment.name}</h6>
                      <p className="mb-0 text-muted">{segment.count.toLocaleString()} clients</p>
                    </div>
                    <Button variant="link" size="sm" className="p-0">
                      <FiChevronRight />
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>

        {/* Filters Card */}
        <MDBCard className="mb-4 shadow-sm" style={{ backgroundColor: '#f8f9fa' }}>
          <MDBCardBody>
            <Row className="align-items-end">
              <Col md={3} className="mb-3 mb-md-0">
                <label className="form-label small text-muted">Search</label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FiSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <label className="form-label small text-muted">Browser</label>
                {mounted ? (
                  <Select
                    options={browserOptions}
                    value={selectedFilters.browser}
                    onChange={(value) => setSelectedFilters({...selectedFilters, browser: value})}
                    isClearable
                    placeholder="All browsers"
                    classNamePrefix="react-select"
                  />
                ) : (
                  <div style={{ height: '38px', backgroundColor: '#f8f9fa', borderRadius: '4px' }} />
                )}
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <label className="form-label small text-muted">Country</label>
                {mounted ? (
                  <Select
                    options={countryOptions}
                    value={selectedFilters.country}
                    onChange={(value) => setSelectedFilters({...selectedFilters, country: value})}
                    isClearable
                    placeholder="All countries"
                    classNamePrefix="react-select"
                  />
                ) : (
                  <div style={{ height: '38px', backgroundColor: '#f8f9fa', borderRadius: '4px' }} />
                )}
              </Col>
              <Col md={3} className="mb-3 mb-md-0">
                <label className="form-label small text-muted">Device Type</label>
                {mounted ? (
                  <Select
                    options={deviceOptions}
                    value={selectedFilters.deviceType}
                    onChange={(value) => setSelectedFilters({...selectedFilters, deviceType: value})}
                    isClearable
                    placeholder="All devices"
                    classNamePrefix="react-select"
                  />
                ) : (
                  <div style={{ height: '38px', backgroundColor: '#f8f9fa', borderRadius: '4px' }} />
                )}
              </Col>
            </Row>
          </MDBCardBody>
        </MDBCard>

        {/* Clients Table */}
        <MDBCard className="shadow-sm">
          <MDBCardBody className="p-0">
            {loading && clients.length === 0 ? (
              <div className="text-center py-5">
                <Spinner animation="border" size="sm" className="me-2" />
                <span>Loading clients...</span>
              </div>
            ) : error ? (
              <Alert variant="danger" className="m-3">
                Error loading clients: {error}
              </Alert>
            ) : clients.length === 0 ? (
              <div className="text-center py-5 text-muted">
                No clients found
              </div>
            ) : (
              <div className="table-responsive">
                <MDBTable hover className="mb-0">
                  <MDBTableHead className="bg-light">
                    <tr>
                      <th style={{ width: '40px' }} className="text-center">
                        <Form.Check
                          type="checkbox"
                          checked={clients.length > 0 && selectedClients.size === clients.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          disabled={clients.length === 0}
                        />
                      </th>
                      <th className="fw-medium">Subscription Date</th>
                      <th className="fw-medium">Browser</th>
                      <th className="fw-medium">Location</th>
                      <th className="fw-medium">Device</th>
                      <th className="fw-medium">Access</th>
                      <th className="fw-medium">Subscribed URL</th>
                      <th className="fw-medium">Tags</th>
                      <th className="fw-medium text-center">Actions</th>
                    </tr>
                  </MDBTableHead>
                  <MDBTableBody>
                    {clients.map((client) => (
                    <tr 
                      key={client.id}
                      className={newClientIds.has(client.id) ? 'new-client-row' : ''}
                      style={newClientIds.has(client.id) ? {
                        backgroundColor: '#d4edda',
                        border: '2px solid #28a745',
                        animation: 'fadeIn 0.5s ease-in'
                      } : {}}
                    >
                      <td className="align-middle text-center">
                        <Form.Check
                          type="checkbox"
                          checked={selectedClients.has(client.id)}
                          onChange={(e) => handleSelectClient(client.id, e.target.checked)}
                        />
                      </td>
                      <td className="align-middle">
                        <div>
                          <div>
                            {mounted ? new Date(client.subscribedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            }) : ''}
                          </div>
                          <small className="text-muted">
                            {mounted ? new Date(client.subscribedAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </small>
                        </div>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          {getBrowserIcon(client.browser)}
                          <div>
                            <div className="fw-medium">{client.browser === 'unknown' ? 'Unknown' : client.browser}</div>
                            {client.browserVersion && client.browserVersion !== 'unknown' && (
                              <small className="text-muted">v{client.browserVersion}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <span className="me-2" style={{ fontSize: '1.2rem' }}>
                            {getFlagEmoji(client.country)}
                          </span>
                          <div>
                            <div>{client.country}</div>
                            <small className="text-muted">{formatIP(client.ip)}</small>
                          </div>
                        </div>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <MDBIcon fas icon={getDeviceIcon(client.device)} className="me-2 text-muted" />
                          <div>
                            <div className="text-capitalize">{client.device === 'unknown' ? 'Unknown' : client.device}</div>
                            {client.os && client.os !== 'unknown' && (
                              <small className="text-muted">{client.os}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="align-middle">
                        <MDBBadge 
                          color={client.accessStatus === 'allowed' ? 'success' : client.accessStatus === 'blocked' ? 'danger' : 'warning'} 
                          pill
                        >
                          {client.accessStatus === 'allowed' ? '✓ Allowed' : client.accessStatus === 'blocked' ? '✗ Blocked' : 'Pending'}
                        </MDBBadge>
                      </td>
                      <td className="align-middle">
                        <a href={client.subscribedUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-decoration-none">
                          {client.subscribedUrl}
                        </a>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex gap-1 flex-wrap">
                          {client.tags.map((tag, index) => (
                            <MDBBadge key={index} color="light" pill className="text-dark">
                              {tag}
                            </MDBBadge>
                          ))}
                        </div>
                      </td>
                      <td className="align-middle text-center">
                        <MDBDropdown>
                          <MDBDropdownToggle tag='button' className='btn btn-link text-dark p-0'>
                            <FiMoreVertical size={20} />
                          </MDBDropdownToggle>
                          <MDBDropdownMenu basic>
                            <MDBDropdownItem onClick={() => handleSendNotification(client)}>
                              <FiSend className="me-2" /> Send Notification
                            </MDBDropdownItem>
                            <MDBDropdownItem className="text-danger" onClick={() => handleDeleteClient(client.id)}>
                              <FiTrash2 className="me-2" /> Delete
                            </MDBDropdownItem>
                          </MDBDropdownMenu>
                        </MDBDropdown>
                      </td>
                    </tr>
                  ))}
                </MDBTableBody>
              </MDBTable>
            </div>
            )}
          </MDBCardBody>
        </MDBCard>
        
        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="text-muted">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, pagination.total)} of {pagination.total} clients
            </div>
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                    Previous
                  </button>
                </li>
                {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                        {pageNum}
                      </button>
                    </li>
                  )
                })}
                <li className={`page-item ${currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      <Modal show={showSendModal} onHide={() => setShowSendModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Send Test Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {notificationSuccess ? (
            <Alert variant="success">
              <FiSend className="me-2" />
              Test notification sent successfully!
            </Alert>
          ) : (
            <>
              <p>Send a test notification to {selectedClient?.browser} user from {selectedClient?.country}?</p>
              <Alert variant="info">
                This will send a test push notification to verify the connection.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSendModal(false)}>
            {notificationSuccess ? 'Close' : 'Cancel'}
          </Button>
          {!notificationSuccess && (
            <Button 
              variant="primary" 
              onClick={handleSendTestNotification}
              disabled={sendingNotification}
            >
              {sendingNotification ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Sending...
                </>
              ) : (
                'Send Test Notification'
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Diagnostic Modal */}
      <Modal show={showDiagnosticModal} onHide={() => setShowDiagnosticModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Push Notification Diagnostics</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {runningDiagnostics ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Running diagnostics...</p>
            </div>
          ) : diagnosticResults?.error ? (
            <Alert variant="danger">
              <strong>Diagnostic Error:</strong> {diagnosticResults.error}
            </Alert>
          ) : diagnosticResults ? (
            <div>
              {/* Client Info */}
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Client Information</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Browser:</strong> {diagnosticResults.client.browser}</p>
                      <p><strong>Device:</strong> {diagnosticResults.client.device}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Status:</strong> <Badge bg={diagnosticResults.client.accessStatus === 'allowed' ? 'success' : 'warning'}>{diagnosticResults.client.accessStatus}</Badge></p>
                      <p><strong>Last Active:</strong> {new Date(diagnosticResults.client.lastActive).toLocaleString()}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Subscription Status */}
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Subscription Status</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <FiCheckCircle className={diagnosticResults.subscription.hasEndpoint ? 'text-success' : 'text-danger'} />
                    <span className="ms-2">Has valid endpoint: {diagnosticResults.subscription.hasEndpoint ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="mb-2">
                    <FiCheckCircle className={diagnosticResults.subscription.endpointValid ? 'text-success' : 'text-danger'} />
                    <span className="ms-2">Endpoint format valid: {diagnosticResults.subscription.endpointValid ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="mb-2">
                    <FiCheckCircle className={diagnosticResults.subscription.hasKeys ? 'text-success' : 'text-danger'} />
                    <span className="ms-2">Has encryption keys: {diagnosticResults.subscription.hasKeys ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="mb-2">
                    <FiCheckCircle className={diagnosticResults.subscription.isValid ? 'text-success' : 'text-danger'} />
                    <span className="ms-2">Overall subscription valid: {diagnosticResults.subscription.isValid ? 'Yes' : 'No'}</span>
                  </div>
                </Card.Body>
              </Card>

              {/* Test Notification Result */}
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Test Notification Result</h6>
                </Card.Header>
                <Card.Body>
                  {diagnosticResults.testNotification.sent ? (
                    diagnosticResults.testNotification.success ? (
                      <Alert variant="success">
                        <FiCheckCircle className="me-2" />
                        Test notification sent successfully!
                      </Alert>
                    ) : (
                      <Alert variant="danger">
                        <strong>Send failed:</strong> {diagnosticResults.testNotification.error || diagnosticResults.testNotification.message}
                      </Alert>
                    )
                  ) : (
                    <Alert variant="warning">
                      Test notification not sent: {diagnosticResults.testNotification.error}
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Environment Check */}
              <Card className="mb-3">
                <Card.Header>
                  <h6 className="mb-0">Environment Configuration</h6>
                </Card.Header>
                <Card.Body>
                  <div className="mb-2">
                    <FiCheckCircle className={diagnosticResults.environment.hasPublicKey ? 'text-success' : 'text-danger'} />
                    <span className="ms-2">VAPID Public Key: {diagnosticResults.environment.hasPublicKey ? 'Configured' : 'Missing'}</span>
                  </div>
                  <div className="mb-2">
                    <FiCheckCircle className={diagnosticResults.environment.hasPrivateKey ? 'text-success' : 'text-danger'} />
                    <span className="ms-2">VAPID Private Key: {diagnosticResults.environment.hasPrivateKey ? 'Configured' : 'Missing'}</span>
                  </div>
                  <div className="mb-2">
                    <FiCheckCircle className={diagnosticResults.environment.hasSubject ? 'text-success' : 'text-danger'} />
                    <span className="ms-2">VAPID Subject: {diagnosticResults.environment.hasSubject ? 'Configured' : 'Missing'}</span>
                  </div>
                </Card.Body>
              </Card>

              {/* Recent Deliveries */}
              {diagnosticResults.recentDeliveries && diagnosticResults.recentDeliveries.length > 0 && (
                <Card>
                  <Card.Header>
                    <h6 className="mb-0">Recent Notification Attempts</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Campaign</th>
                            <th>Status</th>
                            <th>Sent At</th>
                            <th>Error</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diagnosticResults.recentDeliveries.map((delivery) => (
                            <tr key={delivery.id}>
                              <td>{delivery.campaign.name}</td>
                              <td>
                                <Badge bg={
                                  delivery.status === 'delivered' ? 'success' :
                                  delivery.status === 'clicked' ? 'primary' :
                                  delivery.status === 'failed' ? 'danger' : 'secondary'
                                }>
                                  {delivery.status}
                                </Badge>
                              </td>
                              <td>{new Date(delivery.sentAt).toLocaleString()}</td>
                              <td className="text-danger">{delivery.error || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDiagnosticModal(false)}>
            Close
          </Button>
          {diagnosticResults && !diagnosticResults.error && (
            <Button 
              variant="primary" 
              onClick={() => handleDiagnoseClient(selectedClient)}
            >
              <FiTool className="me-2" />
              Re-run Diagnostics
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Create Segment Modal */}
      <Modal show={showSegmentModal} onHide={() => setShowSegmentModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Client Segment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Segment Name</Form.Label>
              <Form.Control type="text" placeholder="e.g., High-value customers, Mobile users in USA" />
            </Form.Group>
            
            <h6 className="mb-3">Segment Criteria</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Device Type</Form.Label>
              <Form.Select>
                <option>All devices</option>
                <option>Desktop only</option>
                <option>Mobile only</option>
                <option>Tablet only</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Browser</Form.Label>
              <Form.Select>
                <option>All browsers</option>
                <option>Chrome</option>
                <option>Safari</option>
                <option>Firefox</option>
                <option>Edge</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Select>
                <option>All countries</option>
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>France</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Subscription Date</Form.Label>
              <Row>
                <Col>
                  <Form.Control type="date" />
                </Col>
                <Col xs="auto" className="d-flex align-items-center">
                  to
                </Col>
                <Col>
                  <Form.Control type="date" />
                </Col>
              </Row>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tags</Form.Label>
              <Form.Control type="text" placeholder="Enter tags separated by commas" />
              <Form.Text>e.g., premium, customer, subscriber</Form.Text>
            </Form.Group>
            
            <div className="p-3 bg-light rounded">
              <small className="text-muted">Estimated segment size</small>
              <h4 className="mb-0 text-primary">1,234 clients</h4>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSegmentModal(false)}>
            Cancel
          </Button>
          <Button variant="primary">
            Create Segment
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}