'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MDBCard, MDBCardBody } from 'mdb-react-ui-kit'
import { Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap'
import { FiEdit, FiCopy, FiClock, FiPercent } from 'react-icons/fi'
import DashboardLayout from '@/components/DashboardLayout'
import { useApi } from '@/lib/hooks/useApi'

export default function PushCampaigns() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Build API URL with filters
  const buildApiUrl = () => {
    const params = new URLSearchParams()
    params.append('page', currentPage)
    params.append('limit', '6')
    if (statusFilter !== 'all') params.append('status', statusFilter)
    return `/api/campaigns?${params.toString()}`
  }
  
  const { data, loading, error, refetch } = useApi(buildApiUrl())
  const campaigns = data?.campaigns || []
  const pagination = data?.pagination || { total: 0, totalPages: 0 }

  useEffect(() => {
    setMounted(true)
  }, [])

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      completed: 'secondary',
      scheduled: 'info',
      draft: 'light',
    }
    return colors[status] || 'secondary'
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
            onClick={() => setStatusFilter('completed')}
          >
            Completed
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
            <Col lg={6} key={campaign.id} className="mb-4">
              <Card className="h-100 shadow-sm custom-card border">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="mb-1">{campaign.name}</h5>
                      <div className="d-flex gap-2 align-items-center">
                        <Badge bg={getStatusColor(campaign.status)} className="text-capitalize">
                          {campaign.status}
                        </Badge>
                        {campaign.abTest?.enabled && (
                          <Badge bg="info">
                            <FiPercent size={12} className="me-1" />
                            A/B Test
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button variant="light" size="sm">
                        <FiEdit size={16} />
                      </Button>
                      <Button variant="light" size="sm">
                        <FiCopy size={16} />
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted d-block mb-1">Preview:</small>
                    {campaign.abTest?.enabled ? (
                      <div>
                        <div className="border rounded p-2 bg-light mb-2">
                          <div className="d-flex align-items-center mb-1">
                            <Badge bg="primary" className="me-2">A</Badge>
                            <small className="text-muted">{campaign.abTest?.trafficSplit || 50}%</small>
                          </div>
                          <strong className="d-block mb-1 small">{campaign.title}</strong>
                          <p className="mb-0 small">{campaign.message}</p>
                        </div>
                        <div className="border rounded p-2 bg-light">
                          <div className="d-flex align-items-center mb-1">
                            <Badge bg="success" className="me-2">B</Badge>
                            <small className="text-muted">{100 - (campaign.abTest?.trafficSplit || 50)}%</small>
                          </div>
                          <strong className="d-block mb-1 small">{campaign.abTest?.variantB?.title || 'Variant B'}</strong>
                          <p className="mb-0 small">{campaign.abTest?.variantB?.message || 'Variant B message'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded p-3 bg-light">
                        <strong className="d-block mb-1">{campaign.title}</strong>
                        <p className="mb-0 small">{campaign.message}</p>
                      </div>
                    )}
                  </div>

                  <Row className="text-center mb-3">
                    <Col xs={3}>
                      <div>
                        <div className="fw-bold">{campaign.sentCount.toLocaleString()}</div>
                        <small className="text-muted">Sent</small>
                      </div>
                    </Col>
                    <Col xs={3}>
                      <div>
                        <div className="fw-bold">{campaign.deliveredCount.toLocaleString()}</div>
                        <small className="text-muted">Delivered</small>
                      </div>
                    </Col>
                    <Col xs={3}>
                      <div>
                        <div className="fw-bold">{campaign.clickedCount.toLocaleString()}</div>
                        <small className="text-muted">Clicked</small>
                      </div>
                    </Col>
                    <Col xs={3}>
                      <div>
                        <div className="fw-bold text-success">{campaign.ctr}%</div>
                        <small className="text-muted">CTR</small>
                      </div>
                    </Col>
                  </Row>

                  {campaign.abTest?.enabled && campaign.status !== 'scheduled' && campaign.status !== 'draft' && (
                    <div className="bg-light rounded p-2 mb-3">
                      <small className="text-muted d-block mb-1">A/B Test Results:</small>
                      <Row className="text-center">
                        <Col xs={6}>
                          <Badge bg="primary" className="mb-1">Variant A</Badge>
                          <div className="small">CTR: {campaign.ctr}%</div>
                        </Col>
                        <Col xs={6}>
                          <Badge bg="success" className="mb-1">Variant B</Badge>
                          <div className="small">CTR: {campaign.abTest?.variantB?.ctr || 0}%</div>
                          {(campaign.abTest?.variantB?.ctr || 0) > campaign.ctr && (
                            <div className="text-success small">↑ Winner</div>
                          )}
                        </Col>
                      </Row>
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      <FiClock className="me-1" />
                      {mounted && (campaign.sentAt || campaign.scheduledFor) ? 
                        new Date(campaign.sentAt || campaign.scheduledFor).toLocaleDateString() : 
                        'Not scheduled'
                      }
                    </small>
                    <Button 
                      variant="primary" 
                      size="sm"
                      onClick={() => router.push(`/notifications/campaigns/${campaign.id}`)}
                    >
                      View Details
                    </Button>
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