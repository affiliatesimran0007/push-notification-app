'use client'

import { MDBCard, MDBCardBody } from 'mdb-react-ui-kit'
import { Row, Col, Card } from 'react-bootstrap'
import { FiTool, FiFileText, FiSend } from 'react-icons/fi'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default function Notifications() {
  const notificationModules = [
    {
      title: 'Campaign Builder',
      description: 'Create and customize your push notification campaigns with our intuitive builder',
      icon: FiTool,
      href: '/notifications/campaign-builder',
      color: 'primary'
    },
    {
      title: 'Push Templates',
      description: 'Browse and manage pre-built templates for common notification scenarios',
      icon: FiFileText,
      href: '/notifications/templates',
      color: 'success'
    },
    {
      title: 'Push Campaigns',
      description: 'View and manage all your active, scheduled, and completed campaigns',
      icon: FiSend,
      href: '/notifications/campaigns',
      color: 'info'
    }
  ]

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h1 className="h3 mb-4">Notifications</h1>
        
        <Row>
          {notificationModules.map((module, index) => {
            const Icon = module.icon
            return (
              <Col lg={4} key={index} className="mb-4">
                <Link href={module.href} className="text-decoration-none">
                  <Card className="h-100 shadow-sm custom-card border">
                    <Card.Body className="text-center py-5">
                      <div className={`bg-${module.color} bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-4`} style={{ width: '80px', height: '80px' }}>
                        <Icon size={40} className={`text-${module.color}`} />
                      </div>
                      <h4 className="mb-3">{module.title}</h4>
                      <p className="text-muted mb-0">{module.description}</p>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            )
          })}
        </Row>

        <MDBCard className="mt-4 shadow-sm">
          <MDBCardBody>
            <h5 className="mb-3">Quick Stats</h5>
            <Row>
              <Col md={3} className="text-center">
                <h3 className="text-primary mb-1">245</h3>
                <p className="text-muted mb-0">Active Campaigns</p>
              </Col>
              <Col md={3} className="text-center">
                <h3 className="text-success mb-1">1.2M</h3>
                <p className="text-muted mb-0">Notifications Sent</p>
              </Col>
              <Col md={3} className="text-center">
                <h3 className="text-info mb-1">89%</h3>
                <p className="text-muted mb-0">Delivery Rate</p>
              </Col>
              <Col md={3} className="text-center">
                <h3 className="text-warning mb-1">42</h3>
                <p className="text-muted mb-0">Templates</p>
              </Col>
            </Row>
          </MDBCardBody>
        </MDBCard>
      </div>
    </DashboardLayout>
  )
}