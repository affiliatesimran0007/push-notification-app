'use client'

import { Card, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap'
import { FiUsers, FiBell, FiTrendingUp, FiActivity } from 'react-icons/fi'
import DashboardLayout from '@/components/DashboardLayout'
import PushSubscription from '@/components/PushSubscription'
import { useApi } from '@/lib/hooks/useApi'
import { mockAnalytics } from '@/lib/data/mockData' // Temporary fallback

export default function Dashboard() {
  const { data, loading, error } = useApi('/api/analytics/dashboard')
  
  const stats = data ? [
    {
      title: 'Total Subscribers',
      value: data.overview.totalSubscribers.toLocaleString(),
      icon: FiUsers,
      color: 'primary',
      change: `+${data.monthlyChange.subscribers}%`,
    },
    {
      title: 'Active Subscribers',
      value: data.overview.activeSubscribers.toLocaleString(),
      icon: FiActivity,
      color: 'success',
      change: `+${data.monthlyChange.activeSubscribers}%`,
    },
    {
      title: 'Notifications Sent',
      value: data.overview.totalNotificationsSent.toLocaleString(),
      icon: FiBell,
      color: 'info',
      change: `+${data.monthlyChange.notifications}%`,
    },
    {
      title: 'Average CTR',
      value: `${data.overview.averageCtr}%`,
      icon: FiTrendingUp,
      color: 'warning',
      change: `+${data.monthlyChange.ctr}%`,
    },
  ] : []

  const recentCampaigns = data?.recentCampaigns || []

  return (
    <DashboardLayout>
      <div className="mb-4">
        <div className="mb-4">
          <h1 className="h3 mb-0">Dashboard Overview</h1>
        </div>
        
        {/* Push Notification Subscription */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-3">Push Notification Status</h5>
                <PushSubscription />
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Stats Cards */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Loading dashboard...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            Error loading dashboard: {error}
          </Alert>
        ) : (
          <>
            <Row className="mb-4">
              {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Col key={index} xs={12} sm={6} lg={3} className="mb-4">
                <Card className="shadow-sm custom-card h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <p className="text-muted mb-1 small">{stat.title}</p>
                        <h4 className="mb-0">{stat.value}</h4>
                      </div>
                      <div className={`bg-${stat.color} bg-opacity-10 p-2 rounded`}>
                        <Icon size={24} className={`text-${stat.color}`} />
                      </div>
                    </div>
                    <Badge bg="light" text="success" className="small">
                      {stat.change} from last month
                    </Badge>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
        </Row>

        {/* Recent Campaigns */}
        <Row>
          <Col lg={8} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Recent Campaigns</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Status</th>
                        <th>Sent</th>
                        <th>CTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCampaigns.map((campaign) => (
                        <tr key={campaign.id}>
                          <td>
                            <div>
                              <div className="fw-medium">{campaign.name}</div>
                              <small className="text-muted">{campaign.type}</small>
                            </div>
                          </td>
                          <td>
                            <Badge 
                              bg={
                                campaign.status === 'active' ? 'success' :
                                campaign.status === 'completed' ? 'secondary' :
                                campaign.status === 'scheduled' ? 'info' : 'light'
                              }
                            >
                              {campaign.status}
                            </Badge>
                          </td>
                          <td>{campaign.sentCount.toLocaleString()}</td>
                          <td>{campaign.ctr}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Quick Stats */}
          <Col lg={4} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Device Breakdown</h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Desktop</span>
                    <span className="fw-medium">{mockAnalytics.deviceBreakdown.desktop}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ width: `${mockAnalytics.deviceBreakdown.desktop}%` }}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Mobile</span>
                    <span className="fw-medium">{mockAnalytics.deviceBreakdown.mobile}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-success" 
                      style={{ width: `${mockAnalytics.deviceBreakdown.mobile}%` }}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tablet</span>
                    <span className="fw-medium">{mockAnalytics.deviceBreakdown.tablet}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar bg-warning" 
                      style={{ width: `${mockAnalytics.deviceBreakdown.tablet}%` }}
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}