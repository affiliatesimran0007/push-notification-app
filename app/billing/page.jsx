'use client'

import { useState } from 'react'
import {
  MDBCard,
  MDBCardBody,
  MDBCardHeader,
  MDBBtn,
  MDBBadge,
  MDBIcon,
  MDBListGroup,
  MDBListGroupItem
} from 'mdb-react-ui-kit'
import { Row, Col, Card, Badge, Button, ProgressBar } from 'react-bootstrap'
import { FiCheck, FiX } from 'react-icons/fi'
import DashboardLayout from '@/components/DashboardLayout'

export default function Billing() {
  const [currentPlan, setCurrentPlan] = useState('starter')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      subscribers: '1,000',
      notifications: '10,000/month',
      features: [
        { name: 'Basic analytics', included: true },
        { name: '1 team member', included: true },
        { name: 'Community support', included: true },
        { name: 'Standard templates', included: true },
        { name: 'A/B testing', included: false },
        { name: 'API access', included: false },
        { name: 'Custom branding', included: false },
        { name: 'Priority support', included: false },
      ],
      color: 'secondary'
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      subscribers: '10,000',
      notifications: '100,000/month',
      features: [
        { name: 'Advanced analytics', included: true },
        { name: '3 team members', included: true },
        { name: 'Email support', included: true },
        { name: 'Custom templates', included: true },
        { name: 'A/B testing', included: true },
        { name: 'API access', included: true },
        { name: 'Custom branding', included: false },
        { name: 'Priority support', included: false },
      ],
      color: 'primary',
      popular: true
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      subscribers: '100,000',
      notifications: 'Unlimited',
      features: [
        { name: 'Premium analytics', included: true },
        { name: '10 team members', included: true },
        { name: 'Priority support', included: true },
        { name: 'Custom templates', included: true },
        { name: 'A/B testing', included: true },
        { name: 'All integrations', included: true },
        { name: 'Custom branding', included: true },
        { name: 'Conversion tracking', included: true },
      ],
      color: 'success'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      subscribers: 'Unlimited',
      notifications: 'Unlimited',
      features: [
        { name: 'Everything in Professional', included: true },
        { name: 'Unlimited team members', included: true },
        { name: 'Dedicated support', included: true },
        { name: 'SLA guarantee', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'On-premise option', included: true },
        { name: 'Advanced security', included: true },
        { name: 'Dedicated infrastructure', included: true },
      ],
      color: 'warning'
    }
  ]

  const currentPlanDetails = {
    usage: {
      subscribers: 7250,
      subscribersLimit: 10000,
      notifications: 45200,
      notificationsLimit: 100000,
    },
    nextBilling: 'February 1, 2024',
    amount: 29
  }

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h1 className="h3 mb-4">Billing & Plans</h1>

        {/* Current Plan Overview */}
        <MDBCard className="mb-4 shadow-sm">
          <MDBCardHeader className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Current Plan: Starter</h5>
              <MDBBadge color="primary" pill>Active</MDBBadge>
            </div>
          </MDBCardHeader>
          <MDBCardBody>
            <Row>
              <Col md={6} className="mb-3">
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Subscribers Used</span>
                    <span className="fw-bold">
                      {currentPlanDetails.usage.subscribers.toLocaleString()} / {currentPlanDetails.usage.subscribersLimit.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar 
                    now={(currentPlanDetails.usage.subscribers / currentPlanDetails.usage.subscribersLimit) * 100} 
                    variant="primary"
                    style={{ height: '8px' }}
                  />
                </div>
              </Col>
              <Col md={6} className="mb-3">
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span>Notifications This Month</span>
                    <span className="fw-bold">
                      {currentPlanDetails.usage.notifications.toLocaleString()} / {currentPlanDetails.usage.notificationsLimit.toLocaleString()}
                    </span>
                  </div>
                  <ProgressBar 
                    now={(currentPlanDetails.usage.notifications / currentPlanDetails.usage.notificationsLimit) * 100} 
                    variant="success"
                    style={{ height: '8px' }}
                  />
                </div>
              </Col>
            </Row>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div>
                <p className="mb-0 text-muted">Next billing date: {currentPlanDetails.nextBilling}</p>
                <p className="mb-0">Amount: <strong>${currentPlanDetails.amount}/month</strong></p>
              </div>
              <div>
                <Button variant="outline-primary" size="sm" className="me-2">
                  Update Payment Method
                </Button>
                <Button variant="outline-secondary" size="sm">
                  View Invoices
                </Button>
              </div>
            </div>
          </MDBCardBody>
        </MDBCard>

        {/* Pricing Plans */}
        <h5 className="mb-3">Available Plans</h5>
        <Row>
          {plans.map((plan) => (
            <Col lg={3} md={6} key={plan.id} className="mb-4">
              <Card className={`h-100 shadow-sm ${plan.popular ? 'border-primary' : ''}`}>
                {plan.popular && (
                  <div className="position-absolute top-0 start-50 translate-middle">
                    <Badge bg="primary" className="px-3 py-2">Most Popular</Badge>
                  </div>
                )}
                <Card.Body className="d-flex flex-column">
                  <div className="text-center mb-4">
                    <h4 className="mb-2">{plan.name}</h4>
                    <div className="mb-2">
                      {typeof plan.price === 'number' ? (
                        <>
                          <span className="display-6">${plan.price}</span>
                          <span className="text-muted">/month</span>
                        </>
                      ) : (
                        <span className="display-6">{plan.price}</span>
                      )}
                    </div>
                    <p className="text-muted mb-0">Up to {plan.subscribers} subscribers</p>
                    <p className="text-muted">{plan.notifications}</p>
                  </div>

                  <MDBListGroup flush className="flex-grow-1 mb-4">
                    {plan.features.map((feature, index) => (
                      <MDBListGroupItem key={index} className="border-0 px-0 py-2">
                        <div className="d-flex align-items-center">
                          {feature.included ? (
                            <FiCheck className="text-success me-2" />
                          ) : (
                            <FiX className="text-muted me-2" />
                          )}
                          <span className={feature.included ? '' : 'text-muted'}>
                            {feature.name}
                          </span>
                        </div>
                      </MDBListGroupItem>
                    ))}
                  </MDBListGroup>

                  <div className="d-grid">
                    {currentPlan === plan.id ? (
                      <Button variant="secondary" disabled>
                        Current Plan
                      </Button>
                    ) : plan.id === 'enterprise' ? (
                      <Button variant="outline-warning">
                        Contact Sales
                      </Button>
                    ) : (
                      <Button 
                        variant={plan.popular ? 'primary' : `outline-${plan.color}`}
                        onClick={() => setCurrentPlan(plan.id)}
                      >
                        {plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Billing History */}
        <MDBCard className="shadow-sm">
          <MDBCardHeader className="bg-white">
            <h5 className="mb-0">Billing History</h5>
          </MDBCardHeader>
          <MDBCardBody>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Jan 1, 2024</td>
                    <td>Starter Plan - Monthly</td>
                    <td>$29.00</td>
                    <td><Badge bg="success">Paid</Badge></td>
                    <td>
                      <Button variant="link" size="sm" className="p-0">
                        <MDBIcon fas icon="download" />
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td>Dec 1, 2023</td>
                    <td>Starter Plan - Monthly</td>
                    <td>$29.00</td>
                    <td><Badge bg="success">Paid</Badge></td>
                    <td>
                      <Button variant="link" size="sm" className="p-0">
                        <MDBIcon fas icon="download" />
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td>Nov 1, 2023</td>
                    <td>Starter Plan - Monthly</td>
                    <td>$29.00</td>
                    <td><Badge bg="success">Paid</Badge></td>
                    <td>
                      <Button variant="link" size="sm" className="p-0">
                        <MDBIcon fas icon="download" />
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </MDBCardBody>
        </MDBCard>
      </div>
    </DashboardLayout>
  )
}