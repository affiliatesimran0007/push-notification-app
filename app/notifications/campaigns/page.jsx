'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MDBCard, MDBCardBody } from 'mdb-react-ui-kit'
import { Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap'
import { FiEdit, FiCopy, FiClock, FiPercent, FiTrash2, FiPlay, FiPause, FiRefreshCw, FiSend, FiCheckCircle, FiMousePointer, FiXCircle, FiAlertCircle, FiUsers, FiGlobe, FiMonitor, FiTrendingUp, FiExternalLink } from 'react-icons/fi'
import { FaWindows, FaApple, FaLinux, FaAndroid, FaChrome, FaFirefox, FaEdge, FaSafari, FaOpera } from 'react-icons/fa'
import DashboardLayout from '@/components/DashboardLayout'
import { useApi, apiCall } from '@/lib/hooks/useApi'

export default function PushCampaigns() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [localCampaigns, setLocalCampaigns] = useState([])
  
  // Build API URL with filters
  const buildApiUrl = () => {
    const params = new URLSearchParams()
    params.append('page', currentPage)
    params.append('limit', '6')
    if (statusFilter !== 'all') params.append('status', statusFilter)
    return `/api/campaigns?${params.toString()}`
  }
  
  const { data, loading, error, refetch } = useApi(buildApiUrl())
  
  // Sort campaigns with drafts first
  const sortCampaigns = (campaigns) => {
    return [...campaigns].sort((a, b) => {
      // Drafts always come first
      if (a.status === 'draft' && b.status !== 'draft') return -1
      if (a.status !== 'draft' && b.status === 'draft') return 1
      
      // For non-drafts, sort by date (newest first)
      const dateA = new Date(a.sentAt || a.scheduledFor || a.createdAt)
      const dateB = new Date(b.sentAt || b.scheduledFor || b.createdAt)
      return dateB - dateA
    })
  }
  
  const campaigns = localCampaigns.length > 0 ? sortCampaigns(localCampaigns) : sortCampaigns(data?.campaigns || [])
  const pagination = data?.pagination || { total: 0, totalPages: 0 }

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Real-time updates using Server-Sent Events
  useEffect(() => {
    let eventSource = null
    
    const connectSSE = () => {
      eventSource = new EventSource('/api/campaigns/stream')
      
      eventSource.onopen = () => {
        console.log('SSE connection established for campaigns')
      }
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'stats-updated':
            console.log('Real-time stats update:', data)
            // Update the specific campaign's stats
            setLocalCampaigns(prev => prev.map(campaign => 
              campaign.id === data.campaignId 
                ? { ...campaign, ...data.stats }
                : campaign
            ))
            break
            
          case 'campaign-created':
            console.log('New campaign created:', data.campaign)
            // Add new campaign to the list
            setLocalCampaigns(prev => sortCampaigns([data.campaign, ...prev]))
            break
            
          case 'status-changed':
            console.log('Campaign status changed:', data)
            // Update campaign status
            setLocalCampaigns(prev => prev.map(campaign => 
              campaign.id === data.campaignId 
                ? { ...campaign, status: data.status }
                : campaign
            ))
            break
            
          case 'campaign-deleted':
            console.log('Campaign deleted:', data.campaignId)
            // Remove campaign from list
            setLocalCampaigns(prev => prev.filter(campaign => campaign.id !== data.campaignId))
            break
            
          case 'heartbeat':
            // Keep-alive signal
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
    
    if (mounted) {
      connectSSE()
    }
    
    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [mounted])
  
  useEffect(() => {
    if (data?.campaigns) {
      setLocalCampaigns(sortCampaigns(data.campaigns))
    }
  }, [data?.campaigns])

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      completed: 'secondary',
      scheduled: 'info',
      draft: 'warning',
    }
    return colors[status] || 'secondary'
  }

  const handleDeleteDraft = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this draft?')) return

    // Remove from local state immediately
    const deletedDraft = localCampaigns.find(c => c.id === campaignId)
    setLocalCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))

    try {
      const response = await apiCall(`/api/campaigns?id=${campaignId}`, {
        method: 'DELETE'
      })

      if (!response.success) {
        // Restore on failure
        if (deletedDraft) {
          setLocalCampaigns(prev => [...prev, deletedDraft])
        }
        alert('Failed to delete draft')
      }
    } catch (error) {
      console.error('Failed to delete draft:', error)
      // Restore on error
      if (deletedDraft) {
        setLocalCampaigns(prev => [...prev, deletedDraft])
      }
      alert('Failed to delete draft')
    }
  }

  const handleEditDraft = (campaign) => {
    // Store draft data in sessionStorage
    sessionStorage.setItem('editDraft', JSON.stringify(campaign))
    router.push('/notifications/campaign-builder')
  }

  const handlePauseCampaign = async (campaignId) => {
    // Update local state immediately
    setLocalCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId ? { ...campaign, status: 'paused' } : campaign
    ))
    
    try {
      const response = await apiCall(`/api/campaigns?id=${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'paused' })
      })

      if (!response.success) {
        // Revert on failure
        setLocalCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId ? { ...campaign, status: 'active' } : campaign
        ))
        alert('Failed to pause campaign')
      }
    } catch (error) {
      console.error('Failed to pause campaign:', error)
      // Revert on error
      setLocalCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId ? { ...campaign, status: 'active' } : campaign
      ))
      alert('Failed to pause campaign')
    }
  }

  const handleResumeCampaign = async (campaignId) => {
    // Update local state immediately
    setLocalCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId ? { ...campaign, status: 'active' } : campaign
    ))
    
    try {
      const response = await apiCall(`/api/campaigns?id=${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'active' })
      })

      if (!response.success) {
        // Revert on failure
        setLocalCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId ? { ...campaign, status: 'paused' } : campaign
        ))
        alert('Failed to resume campaign')
      }
    } catch (error) {
      console.error('Failed to resume campaign:', error)
      // Revert on error
      setLocalCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId ? { ...campaign, status: 'paused' } : campaign
      ))
      alert('Failed to resume campaign')
    }
  }

  const handleCancelScheduled = async (campaignId) => {
    if (!confirm('Are you sure you want to cancel this scheduled campaign?')) return
    
    // Update local state immediately
    setLocalCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId ? { ...campaign, status: 'draft', scheduledFor: null } : campaign
    ))
    
    try {
      const response = await apiCall(`/api/campaigns?id=${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'draft', scheduledFor: null })
      })

      if (!response.success) {
        // Revert on failure
        setLocalCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId ? { ...campaign, status: 'scheduled' } : campaign
        ))
        alert('Failed to cancel scheduled campaign')
      }
    } catch (error) {
      console.error('Failed to cancel scheduled campaign:', error)
      // Revert on error
      setLocalCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId ? { ...campaign, status: 'scheduled' } : campaign
      ))
      alert('Failed to cancel scheduled campaign')
    }
  }

  const handleRefreshStats = async (campaignId) => {
    try {
      const response = await apiCall(`/api/campaigns/${campaignId}`)
      if (response && response.campaign) {
        // Update the specific campaign in local state
        setLocalCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId ? { ...campaign, ...response.campaign } : campaign
        ))
        
        // Also trigger a full refetch to ensure consistency
        refetch()
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error)
    }
  }

  const handleDuplicateCampaign = (campaign) => {
    // Create a duplicate campaign object with modified name
    const duplicatedCampaign = {
      ...campaign,
      id: null, // Clear ID so it creates a new campaign
      name: campaign.name + ' (Copy)',
      status: 'draft', // Always start as draft
      scheduledFor: null, // Clear scheduled time
      sentAt: null,
      sentCount: 0,
      deliveredCount: 0,
      clickedCount: 0,
      failedCount: 0,
      createdAt: null,
      updatedAt: null
    }
    
    // Store in sessionStorage
    sessionStorage.setItem('editDraft', JSON.stringify(duplicatedCampaign))
    
    // Redirect to campaign builder
    router.push('/notifications/campaign-builder')
  }

  const handleDeleteCampaign = async (campaignId, status) => {
    let warningMessage = 'Are you sure you want to delete this campaign?'
    
    if (status === 'active') {
      warningMessage = 'This campaign is currently active. Are you sure you want to delete it?'
    } else if (status === 'scheduled') {
      warningMessage = 'This campaign is scheduled. Are you sure you want to delete it?'
    }
    
    if (!confirm(warningMessage)) return

    // Remove from local state immediately
    const deletedCampaign = localCampaigns.find(c => c.id === campaignId)
    setLocalCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))

    try {
      const response = await apiCall(`/api/campaigns?id=${campaignId}`, {
        method: 'DELETE'
      })

      if (!response.success) {
        // Restore on failure
        if (deletedCampaign) {
          setLocalCampaigns(prev => [...prev, deletedCampaign])
        }
        alert('Failed to delete campaign')
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      // Restore on error
      if (deletedCampaign) {
        setLocalCampaigns(prev => [...prev, deletedCampaign])
      }
      alert('Failed to delete campaign')
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Push Campaigns</h1>
          <Button 
            variant="primary"
            onClick={() => router.push('/notifications/campaign-builder')}
          >
            <i className="fas fa-plus me-2"></i>
            New Campaign
          </Button>
        </div>
        
        {/* Status Filter */}
        <div className="mb-4">
          <Button 
            variant={statusFilter === 'all' ? 'primary' : 'outline-primary'} 
            size="sm" 
            className="me-2"
            onClick={() => setStatusFilter('all')}
          >
            All Campaigns
          </Button>
          <Button 
            variant={statusFilter === 'active' ? 'primary' : 'outline-primary'} 
            size="sm" 
            className="me-2"
            onClick={() => setStatusFilter('active')}
          >
            Active
          </Button>
          <Button 
            variant={statusFilter === 'scheduled' ? 'primary' : 'outline-primary'} 
            size="sm" 
            className="me-2"
            onClick={() => setStatusFilter('scheduled')}
          >
            Scheduled
          </Button>
          <Button 
            variant={statusFilter === 'completed' ? 'primary' : 'outline-primary'} 
            size="sm"
            className="me-2"
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </Button>
          <Button 
            variant={statusFilter === 'draft' ? 'primary' : 'outline-primary'} 
            size="sm"
            onClick={() => setStatusFilter('draft')}
          >
            Drafts
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading campaigns...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            Error loading campaigns: {error}
          </Alert>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">No campaigns found</p>
            <Button variant="primary" onClick={() => router.push('/notifications/campaign-builder')}>
              Create Your First Campaign
            </Button>
          </div>
        ) : (
          <Row>
            {campaigns.map((campaign) => (
            <Col xl={6} key={campaign.id} className="mb-4">
              <Card className="shadow-sm border-0 overflow-hidden">
                <Card.Body className="p-0">
                  {/* Header Section */}
                  <div className="px-0 pt-4 pb-3 border-bottom bg-light">
                    <Row className="align-items-start mx-0">
                      <Col md={8} className="px-4">
                        <div className="d-flex align-items-start">
                          <div className="me-3" style={{ marginLeft: '0' }}>
                            <div style={{ width: '64px' }}>
                              {campaign.icon && (
                                <img 
                                  src={campaign.icon} 
                                  alt="Campaign icon" 
                                  style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                                  className="rounded border border-2 mb-2"
                                />
                              )}
                              <div className="text-center">
                                <Badge bg={getStatusColor(campaign.status)} className="text-capitalize">
                                  {campaign.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <div className="mb-1">
                              <div className="d-flex align-items-center gap-2">
                                <h5 className="mb-0">{campaign.name}</h5>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="p-0 text-muted"
                                  title="Duplicate Campaign"
                                  onClick={() => handleDuplicateCampaign(campaign)}
                                >
                                  <FiCopy size={14} />
                                </Button>
                              </div>
                              <div className="d-flex gap-2">
                                <small className="text-muted">#{campaign.id.slice(0, 8)}</small>
                                <small className="text-primary d-flex align-items-center">
                                  <FiClock size={12} className="me-1" />
                                  {mounted && (campaign.sentAt || campaign.scheduledFor) ? 
                                    new Date(campaign.sentAt || campaign.scheduledFor).toLocaleString('en-IN', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                      hour12: true
                                    }).replace(/am/i, 'AM').replace(/pm/i, 'PM') : 
                                    'Not scheduled'
                                  }
                                </small>
                              </div>
                            </div>
                            {campaign.scheduledFor && (
                              <div className="mb-2">
                                <Badge bg="light" text="dark">
                                  <FiClock size={12} className="me-1" />
                                  {new Date(campaign.scheduledFor).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                </Badge>
                              </div>
                            )}
                            <div className="text-muted small">
                              <strong>Title:</strong> {campaign.title || 'No title'}<br/>
                              <strong>Message:</strong> {campaign.message || 'No message'}
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col md={4} className="text-md-end px-4">
                        <div className="d-flex gap-2 justify-content-md-end">
                          {campaign.status === 'active' ? (
                            <Button 
                              variant="warning" 
                              size="sm" 
                              title="Pause Campaign"
                              onClick={() => handlePauseCampaign(campaign.id)}
                              className="d-flex align-items-center justify-content-center"
                              style={{ width: '32px', height: '32px', padding: '0' }}
                            >
                              <FiPause size={16} />
                            </Button>
                          ) : campaign.status === 'paused' ? (
                            <Button 
                              variant="success" 
                              size="sm" 
                              title="Resume Campaign"
                              onClick={() => handleResumeCampaign(campaign.id)}
                              className="d-flex align-items-center justify-content-center"
                              style={{ width: '32px', height: '32px', padding: '0' }}
                            >
                              <FiPlay size={16} />
                            </Button>
                          ) : campaign.status === 'scheduled' ? (
                            <Button 
                              variant="danger" 
                              size="sm" 
                              title="Cancel Schedule"
                              onClick={() => handleCancelScheduled(campaign.id)}
                              className="d-flex align-items-center justify-content-center"
                              style={{ width: '32px', height: '32px', padding: '0' }}
                            >
                              <FiXCircle size={16} />
                            </Button>
                          ) : null}
                          
                          <Button 
                            variant="info" 
                            size="sm" 
                            title="Refresh Stats"
                            onClick={() => handleRefreshStats(campaign.id)}
                            className="d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', padding: '0' }}
                          >
                            <FiRefreshCw size={16} />
                          </Button>
                          
                          {campaign.status === 'draft' && (
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => handleEditDraft(campaign)}
                              title="Edit Draft"
                              className="d-flex align-items-center justify-content-center"
                              style={{ width: '32px', height: '32px', padding: '0' }}
                            >
                              <FiEdit size={16} />
                            </Button>
                          )}
                          
                          <Button 
                            variant="danger" 
                            size="sm" 
                            title="Delete Campaign"
                            onClick={() => handleDeleteCampaign(campaign.id, campaign.status)}
                            className="d-flex align-items-center justify-content-center"
                            style={{ width: '32px', height: '32px', padding: '0' }}
                          >
                            <FiTrash2 size={16} />
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>

                  {/* Targeting Info */}
                  <div className="p-4 py-3 border-bottom">
                    <Row>
                      <Col md={4}>
                        <div className="d-flex align-items-start mb-2">
                          <FiUsers className="text-primary me-2 mt-1" size={20} />
                          <div>
                            <div className="text-muted" style={{ fontSize: '0.9375rem' }}>Target Audience</div>
                            <span style={{ fontSize: '0.875rem' }}>{campaign.targetAudience === 'all' ? 'All' : (campaign.targetAudience || 'All Subscribers')}</span>
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="d-flex align-items-start mb-2">
                          <FiMonitor className="text-info me-2 mt-1" size={20} />
                          <div>
                            <div className="text-muted" style={{ fontSize: '0.9375rem' }}>Target Browsers</div>
                            <div className="d-flex gap-1 mt-1">
                              {campaign.variantA?.targetBrowsers?.all ? (
                                <span className="small">All Browsers</span>
                              ) : campaign.variantA?.targetBrowsers ? (
                                <>
                                  {campaign.variantA.targetBrowsers.chrome && <FaChrome size={16} className="text-info" />}
                                  {campaign.variantA.targetBrowsers.firefox && <FaFirefox size={16} className="text-warning" />}
                                  {campaign.variantA.targetBrowsers.edge && <FaEdge size={16} className="text-primary" />}
                                  {campaign.variantA.targetBrowsers.safari && <FaSafari size={16} className="text-secondary" />}
                                  {campaign.variantA.targetBrowsers.opera && <FaOpera size={16} className="text-danger" />}
                                </>
                              ) : (
                                <span className="small">All Browsers</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col md={4}>
                        <div className="d-flex align-items-start mb-2">
                          <FiGlobe className="text-success me-2 mt-1" size={20} />
                          <div>
                            <div className="text-muted" style={{ fontSize: '0.9375rem' }}>Operating Systems</div>
                            <div className="d-flex gap-1 mt-1">
                              {campaign.variantA?.targetSystems?.all ? (
                                <span className="small">All Systems</span>
                              ) : campaign.variantA?.targetSystems ? (
                                <>
                                  {campaign.variantA.targetSystems.windows && <FaWindows size={16} className="text-info" />}
                                  {campaign.variantA.targetSystems.macos && <FaApple size={16} className="text-dark" />}
                                  {campaign.variantA.targetSystems.linux && <FaLinux size={16} className="text-warning" />}
                                  {campaign.variantA.targetSystems.android && <FaAndroid size={16} className="text-success" />}
                                  {campaign.variantA.targetSystems.ios && <FaApple size={16} className="text-dark" />}
                                </>
                              ) : (
                                <span className="small">All Systems</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                    {campaign.url && (
                      <div className="mt-2 d-flex align-items-start">
                        <FiExternalLink className="text-primary me-2 mt-1" size={20} />
                        <div>
                          <div style={{ fontSize: '0.9375rem' }}>
                            <span className="text-muted">Landing Page: </span>
                            <a href={campaign.url} target="_blank" rel="noopener noreferrer">
                              {campaign.url}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Stats */}
                  <div className="p-4">
                    <h6 className="mb-4">Delivery Details</h6>
                    <Row className="g-3">
                      <Col xs={6} sm={4} lg={2}>
                        <div className="text-center">
                          <div className="position-relative d-inline-block">
                            <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <FiUsers size={20} className="text-primary" />
                            </div>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ transform: 'translate(-50%, -50%) !important' }}>
                              {campaign.sentCount.toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">Total</small>
                          </div>
                        </div>
                      </Col>
                      <Col xs={6} sm={4} lg={2}>
                        <div className="text-center">
                          <div className="position-relative d-inline-block">
                            <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <FiClock size={20} className="text-warning" />
                            </div>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning" style={{ transform: 'translate(-50%, -50%) !important' }}>
                              {0}
                            </span>
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">Pending</small>
                          </div>
                        </div>
                      </Col>
                      <Col xs={6} sm={4} lg={2}>
                        <div className="text-center">
                          <div className="position-relative d-inline-block">
                            <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <FiSend size={20} className="text-info" />
                            </div>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-info" style={{ transform: 'translate(-50%, -50%) !important' }}>
                              {campaign.sentCount.toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">Sent</small>
                          </div>
                        </div>
                      </Col>
                      <Col xs={6} sm={4} lg={2}>
                        <div className="text-center">
                          <div className="position-relative d-inline-block">
                            <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <FiCheckCircle size={20} className="text-success" />
                            </div>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success" style={{ transform: 'translate(-50%, -50%) !important' }}>
                              {campaign.deliveredCount.toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">Delivered</small>
                          </div>
                        </div>
                      </Col>
                      <Col xs={6} sm={4} lg={2}>
                        <div className="text-center">
                          <div className="position-relative d-inline-block">
                            <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <FiMousePointer size={20} className="text-primary" />
                            </div>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary" style={{ transform: 'translate(-50%, -50%) !important' }}>
                              {campaign.clickedCount.toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">Clicks</small>
                          </div>
                        </div>
                      </Col>
                      <Col xs={6} sm={4} lg={2}>
                        <div className="text-center">
                          <div className="position-relative d-inline-block">
                            <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              <FiXCircle size={20} className="text-secondary" />
                            </div>
                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary" style={{ transform: 'translate(-50%, -50%) !important' }}>
                              {0}
                            </span>
                          </div>
                          <div className="mt-2">
                            <small className="text-muted">Dismissed</small>
                          </div>
                        </div>
                      </Col>
                      <Col xs={12} className="mt-4">
                        <div className="text-center">
                          <div className="d-inline-flex align-items-center">
                            <div className="position-relative d-inline-block">
                              <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <FiAlertCircle size={20} className="text-danger" />
                              </div>
                              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ transform: 'translate(-50%, -50%) !important' }}>
                                {(campaign.failedCount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-start ms-2">
                              <small className="text-muted">Errors</small>
                            </div>
                          </div>
                          <div className="d-inline-flex align-items-center ms-5">
                            <div className="position-relative d-inline-block">
                              <div className="rounded-circle bg-secondary bg-opacity-10 d-inline-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                <FiTrendingUp size={20} className="text-success" />
                              </div>
                              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success" style={{ transform: 'translate(-50%, -50%) !important' }}>
                                {campaign.ctr || 0}%
                              </span>
                            </div>
                            <div className="text-start ms-2">
                              <small className="text-muted">CTR</small>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                  

                </Card.Body>
              </Card>
            </Col>
          ))}
          </Row>
        )}
        
        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <nav>
              <ul className="pagination">
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
    </DashboardLayout>
  )
}