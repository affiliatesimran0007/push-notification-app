'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  MDBCard, 
  MDBCardBody, 
  MDBBadge,
  MDBTabs,
  MDBTabsItem,
  MDBTabsLink,
  MDBTabsContent,
  MDBTabsPane
} from 'mdb-react-ui-kit'
import { 
  Row, 
  Col, 
  Button, 
  Badge, 
  Card, 
  ProgressBar,
  Table,
  Alert,
  Breadcrumb
} from 'react-bootstrap'
import { 
  FiEdit, 
  FiCopy, 
  FiPause, 
  FiPlay, 
  FiTrash2, 
  FiDownload,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiSend,
  FiMousePointer,
  FiPercent,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiGlobe,
  FiArrowLeft
} from 'react-icons/fi'
import { Line, Pie, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js'
import DashboardLayout from '@/components/DashboardLayout'
import { mockCampaigns } from '@/lib/data/mockData'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

export default function CampaignDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Find campaign by ID
    const foundCampaign = mockCampaigns.find(c => c.id === parseInt(params.id))
    if (foundCampaign) {
      setCampaign(foundCampaign)
    }
  }, [params.id])

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="text-center py-5">
          <h3>Campaign not found</h3>
          <Button variant="primary" onClick={() => router.push('/notifications/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      completed: 'secondary',
      scheduled: 'info',
      draft: 'light',
    }
    return colors[status] || 'secondary'
  }

  const getEventIcon = (type) => {
    switch(type) {
      case 'success': return <FiCheckCircle className="text-success" />
      case 'error': return <FiXCircle className="text-danger" />
      case 'info': return <FiAlertCircle className="text-info" />
      default: return <FiAlertCircle className="text-secondary" />
    }
  }

  // Chart data
  const hourlyChartData = {
    labels: campaign.hourlyStats?.map(stat => stat.hour) || [],
    datasets: [
      {
        label: 'Clicks',
        data: campaign.hourlyStats?.map(stat => stat.clicks) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }
    ]
  }

  const deviceChartData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [
        campaign.deviceBreakdown?.desktop || 0,
        campaign.deviceBreakdown?.mobile || 0,
        campaign.deviceBreakdown?.tablet || 0
      ],
      backgroundColor: [
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(255, 206, 86, 0.8)'
      ]
    }]
  }

  const geoChartData = {
    labels: campaign.geographicData?.map(geo => geo.country) || [],
    datasets: [{
      label: 'Recipients',
      data: campaign.geographicData?.map(geo => geo.count) || [],
      backgroundColor: 'rgba(75, 192, 192, 0.6)'
    }]
  }

  const deliveryRate = ((campaign.deliveredCount / campaign.sentCount) * 100).toFixed(1)
  const failureRate = ((campaign.failedCount / campaign.sentCount) * 100).toFixed(1)

  // Calculate A/B test metrics
  const variantAMetrics = campaign.isABTest ? {
    sent: Math.floor(campaign.sentCount * (campaign.trafficSplit / 100)),
    delivered: Math.floor(campaign.deliveredCount * (campaign.trafficSplit / 100)),
    clicked: campaign.clickedCount,
    ctr: campaign.ctr
  } : null

  const variantBMetrics = campaign.isABTest && campaign.variantB ? {
    sent: campaign.variantB.sentCount || Math.floor(campaign.sentCount * ((100 - campaign.trafficSplit) / 100)),
    delivered: campaign.variantB.deliveredCount || Math.floor(campaign.deliveredCount * ((100 - campaign.trafficSplit) / 100)),
    clicked: campaign.variantB.clickedCount,
    ctr: campaign.variantB.ctr
  } : null

  return (
    <DashboardLayout>
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item onClick={() => router.push('/dashboard')}>Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => router.push('/notifications')}>Notifications</Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => router.push('/notifications/campaigns')}>Campaigns</Breadcrumb.Item>
        <Breadcrumb.Item active>{campaign.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <Button 
              variant="light" 
              size="sm"
              onClick={() => router.push('/notifications/campaigns')}
            >
              <FiArrowLeft />
            </Button>
            <h2 className="mb-0">{campaign.name}</h2>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Badge bg={getStatusColor(campaign.status)} className="text-capitalize">
              {campaign.status}
            </Badge>
            {campaign.isABTest && (
              <Badge bg="info">
                <FiPercent size={12} className="me-1" />
                A/B Test
              </Badge>
            )}
            <span className="text-muted">ID: #{campaign.id}</span>
          </div>
        </div>
        <div className="d-flex gap-2">
          {campaign.status === 'active' && (
            <Button variant="warning" size="sm">
              <FiPause className="me-1" /> Pause
            </Button>
          )}
          {campaign.status === 'scheduled' && (
            <Button variant="danger" size="sm">
              Cancel
            </Button>
          )}
          <Button variant="outline-primary" size="sm">
            <FiEdit className="me-1" /> Edit
          </Button>
          <Button variant="outline-secondary" size="sm">
            <FiCopy className="me-1" /> Duplicate
          </Button>
          <Button variant="outline-success" size="sm">
            <FiDownload className="me-1" /> Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <MDBCard className="shadow-sm">
        <MDBCardBody>
          <MDBTabs className="mb-4">
            <MDBTabsItem>
              <MDBTabsLink onClick={() => setActiveTab('overview')} active={activeTab === 'overview'}>
                Overview
              </MDBTabsLink>
            </MDBTabsItem>
            <MDBTabsItem>
              <MDBTabsLink onClick={() => setActiveTab('analytics')} active={activeTab === 'analytics'}>
                Analytics
              </MDBTabsLink>
            </MDBTabsItem>
            {campaign.isABTest && (
              <MDBTabsItem>
                <MDBTabsLink onClick={() => setActiveTab('abtest')} active={activeTab === 'abtest'}>
                  A/B Test Results
                </MDBTabsLink>
              </MDBTabsItem>
            )}
            <MDBTabsItem>
              <MDBTabsLink onClick={() => setActiveTab('activity')} active={activeTab === 'activity'}>
                Activity Log
              </MDBTabsLink>
            </MDBTabsItem>
          </MDBTabs>

          <MDBTabsContent>
            {/* Overview Tab */}
            <MDBTabsPane open={activeTab === 'overview'}>
              {/* Campaign Info */}
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <h5 className="mb-3">Campaign Information</h5>
                      <Table borderless size="sm">
                        <tbody>
                          <tr>
                            <td className="text-muted">Type:</td>
                            <td className="fw-medium text-capitalize">{campaign.type}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Target Audience:</td>
                            <td className="fw-medium">{campaign.targetAudience}</td>
                          </tr>
                          <tr>
                            <td className="text-muted">Created:</td>
                            <td className="fw-medium">
                              {mounted && campaign.createdAt ? 
                                new Date(campaign.createdAt).toLocaleString() : 
                                '-'
                              }
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Scheduled/Sent:</td>
                            <td className="fw-medium">
                              {mounted && campaign.scheduledTime ? 
                                new Date(campaign.scheduledTime).toLocaleString() : 
                                '-'
                              }
                            </td>
                          </tr>
                          <tr>
                            <td className="text-muted">Landing URL:</td>
                            <td>
                              <a href={campaign.url} target="_blank" rel="noopener noreferrer">
                                {campaign.url}
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100">
                    <Card.Body>
                      <h5 className="mb-3">Notification Preview</h5>
                      {campaign.isABTest ? (
                        <div>
                          <div className="border rounded p-3 mb-3">
                            <Badge bg="primary" className="mb-2">Variant A ({campaign.trafficSplit}%)</Badge>
                            <h6>{campaign.title}</h6>
                            <p className="mb-0">{campaign.message}</p>
                          </div>
                          <div className="border rounded p-3">
                            <Badge bg="success" className="mb-2">Variant B ({100 - campaign.trafficSplit}%)</Badge>
                            <h6>{campaign.variantB.title}</h6>
                            <p className="mb-0">{campaign.variantB.message}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="border rounded p-3">
                          <h6>{campaign.title}</h6>
                          <p className="mb-0">{campaign.message}</p>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Performance Metrics */}
              <h5 className="mb-3">Performance Metrics</h5>
              <Row className="mb-4">
                <Col md={3} className="mb-3">
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FiSend size={32} className="text-primary mb-2" />
                      <h3 className="mb-0">{campaign.sentCount.toLocaleString()}</h3>
                      <p className="text-muted mb-0">Total Sent</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FiCheckCircle size={32} className="text-success mb-2" />
                      <h3 className="mb-0">{campaign.deliveredCount.toLocaleString()}</h3>
                      <p className="text-muted mb-0">Delivered</p>
                      <small className="text-success">{deliveryRate}% rate</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FiMousePointer size={32} className="text-info mb-2" />
                      <h3 className="mb-0">{campaign.clickedCount.toLocaleString()}</h3>
                      <p className="text-muted mb-0">Clicked</p>
                      <small className="text-info">{campaign.ctr}% CTR</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3} className="mb-3">
                  <Card className="text-center h-100">
                    <Card.Body>
                      <FiXCircle size={32} className="text-danger mb-2" />
                      <h3 className="mb-0">{campaign.failedCount.toLocaleString()}</h3>
                      <p className="text-muted mb-0">Failed</p>
                      <small className="text-danger">{failureRate}% rate</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Quick Stats */}
              {campaign.status === 'active' && (
                <Alert variant="info">
                  <FiAlertCircle className="me-2" />
                  This campaign is currently active and sending notifications.
                </Alert>
              )}
            </MDBTabsPane>

            {/* Analytics Tab */}
            <MDBTabsPane open={activeTab === 'analytics'}>
              <Row className="mb-4">
                <Col md={12} className="mb-4">
                  <Card>
                    <Card.Body>
                      <h5 className="mb-3">Clicks Over Time</h5>
                      <div style={{ height: '300px' }}>
                        <Line 
                          data={hourlyChartData} 
                          options={{ 
                            maintainAspectRatio: false,
                            responsive: true,
                            plugins: {
                              legend: {
                                display: false
                              }
                            }
                          }} 
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-4">
                  <Card>
                    <Card.Body>
                      <h5 className="mb-3">Device Breakdown</h5>
                      <div style={{ height: '300px' }}>
                        <Pie 
                          data={deviceChartData} 
                          options={{ 
                            maintainAspectRatio: false,
                            responsive: true
                          }} 
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} className="mb-4">
                  <Card>
                    <Card.Body>
                      <h5 className="mb-3">Geographic Distribution</h5>
                      <div style={{ height: '300px' }}>
                        <Bar 
                          data={geoChartData} 
                          options={{ 
                            maintainAspectRatio: false,
                            responsive: true,
                            plugins: {
                              legend: {
                                display: false
                              }
                            }
                          }} 
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </MDBTabsPane>

            {/* A/B Test Results Tab */}
            {campaign.isABTest && (
              <MDBTabsPane open={activeTab === 'abtest'}>
                <Row className="mb-4">
                  <Col md={12}>
                    <Alert variant="info" className="mb-4">
                      <FiPercent className="me-2" />
                      Traffic was split {campaign.trafficSplit}% to Variant A and {100 - campaign.trafficSplit}% to Variant B
                    </Alert>
                  </Col>
                </Row>

                <Row className="mb-4">
                  <Col md={6}>
                    <Card className="border-primary">
                      <Card.Header className="bg-primary text-white">
                        <h5 className="mb-0">Variant A</h5>
                      </Card.Header>
                      <Card.Body>
                        <h6>Message:</h6>
                        <div className="border rounded p-3 mb-3 bg-light">
                          <strong>{campaign.title}</strong>
                          <p className="mb-0 mt-2">{campaign.message}</p>
                        </div>
                        <h6>Performance:</h6>
                        <Table bordered size="sm">
                          <tbody>
                            <tr>
                              <td>Sent</td>
                              <td className="text-end">{variantAMetrics?.sent.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td>Delivered</td>
                              <td className="text-end">{variantAMetrics?.delivered.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td>Clicked</td>
                              <td className="text-end">{variantAMetrics?.clicked.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td>CTR</td>
                              <td className="text-end fw-bold">{variantAMetrics?.ctr}%</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="border-success">
                      <Card.Header className="bg-success text-white">
                        <h5 className="mb-0">
                          Variant B 
                          {campaign.variantB.ctr > campaign.ctr && (
                            <Badge bg="warning" className="ms-2">Winner</Badge>
                          )}
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <h6>Message:</h6>
                        <div className="border rounded p-3 mb-3 bg-light">
                          <strong>{campaign.variantB.title}</strong>
                          <p className="mb-0 mt-2">{campaign.variantB.message}</p>
                        </div>
                        <h6>Performance:</h6>
                        <Table bordered size="sm">
                          <tbody>
                            <tr>
                              <td>Sent</td>
                              <td className="text-end">{variantBMetrics?.sent.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td>Delivered</td>
                              <td className="text-end">{variantBMetrics?.delivered.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td>Clicked</td>
                              <td className="text-end">{variantBMetrics?.clicked.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td>CTR</td>
                              <td className="text-end fw-bold text-success">{variantBMetrics?.ctr}%</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <Row>
                  <Col md={12}>
                    <Card className="bg-light">
                      <Card.Body>
                        <h5 className="mb-3">Statistical Analysis</h5>
                        <div className="mb-3">
                          <strong>Confidence Level:</strong> 95%
                        </div>
                        <div className="mb-3">
                          <strong>Result:</strong> Variant B shows a{' '}
                          <span className="text-success fw-bold">
                            {((campaign.variantB.ctr - campaign.ctr) / campaign.ctr * 100).toFixed(1)}%
                          </span>{' '}
                          improvement in CTR over Variant A
                        </div>
                        <ProgressBar>
                          <ProgressBar 
                            variant="primary" 
                            now={campaign.trafficSplit} 
                            label={`A: ${campaign.ctr}%`}
                          />
                          <ProgressBar 
                            variant="success" 
                            now={100 - campaign.trafficSplit} 
                            label={`B: ${campaign.variantB.ctr}%`}
                          />
                        </ProgressBar>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </MDBTabsPane>
            )}

            {/* Activity Log Tab */}
            <MDBTabsPane open={activeTab === 'activity'}>
              <Card>
                <Card.Body>
                  <h5 className="mb-4">Campaign Activity Timeline</h5>
                  <div className="timeline">
                    {campaign.activityLog?.map((activity, index) => (
                      <div key={index} className="d-flex mb-3">
                        <div className="me-3">{getEventIcon(activity.type)}</div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <strong>{activity.event}</strong>
                            <small className="text-muted">
                              {mounted && new Date(activity.timestamp).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </MDBTabsPane>
          </MDBTabsContent>
        </MDBCardBody>
      </MDBCard>
    </DashboardLayout>
  )
}