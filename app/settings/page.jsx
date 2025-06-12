'use client'

import { useState } from 'react'
import {
  MDBCard,
  MDBCardBody,
  MDBTabs,
  MDBTabsItem,
  MDBTabsLink,
  MDBTabsContent,
  MDBTabsPane,
  MDBInput,
  MDBBtn,
  MDBSwitch
} from 'mdb-react-ui-kit'
import { Row, Col, Form, Button, Alert } from 'react-bootstrap'
import DashboardLayout from '@/components/DashboardLayout'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [showAlert, setShowAlert] = useState(false)

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h1 className="h3 mb-4">Settings</h1>

        {showAlert && (
          <Alert variant="success" dismissible onClose={() => setShowAlert(false)}>
            Settings have been updated successfully!
          </Alert>
        )}

        <MDBCard className="shadow-sm">
          <MDBCardBody>
            <MDBTabs className="mb-3">
              <MDBTabsItem>
                <MDBTabsLink onClick={() => setActiveTab('general')} active={activeTab === 'general'}>
                  General
                </MDBTabsLink>
              </MDBTabsItem>
              <MDBTabsItem>
                <MDBTabsLink onClick={() => setActiveTab('notifications')} active={activeTab === 'notifications'}>
                  Notifications
                </MDBTabsLink>
              </MDBTabsItem>
              <MDBTabsItem>
                <MDBTabsLink onClick={() => setActiveTab('team')} active={activeTab === 'team'}>
                  Team
                </MDBTabsLink>
              </MDBTabsItem>
              <MDBTabsItem>
                <MDBTabsLink onClick={() => setActiveTab('api')} active={activeTab === 'api'}>
                  API Keys
                </MDBTabsLink>
              </MDBTabsItem>
              <MDBTabsItem>
                <MDBTabsLink onClick={() => setActiveTab('compliance')} active={activeTab === 'compliance'}>
                  Compliance
                </MDBTabsLink>
              </MDBTabsItem>
            </MDBTabs>

            <MDBTabsContent>
              {/* General Settings */}
              <MDBTabsPane open={activeTab === 'general'}>
                <h5 className="mb-4">General Settings</h5>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Organization Name</Form.Label>
                        <Form.Control type="text" defaultValue="Acme Corporation" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Website URL</Form.Label>
                        <Form.Control type="url" defaultValue="https://example.com" />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Support Email</Form.Label>
                        <Form.Control type="email" defaultValue="support@example.com" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Time Zone</Form.Label>
                        <Form.Select defaultValue="America/New_York">
                          <option>America/New_York</option>
                          <option>America/Chicago</option>
                          <option>America/Denver</option>
                          <option>America/Los_Angeles</option>
                          <option>Europe/London</option>
                          <option>Europe/Paris</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <MDBBtn color="primary" onClick={() => setShowAlert(true)}>
                    Save Changes
                  </MDBBtn>
                </Form>
              </MDBTabsPane>

              {/* Notification Settings */}
              <MDBTabsPane open={activeTab === 'notifications'}>
                <h5 className="mb-4">Notification Settings</h5>
                <Form>
                  <div className="mb-4">
                    <h6 className="mb-3">Default Notification Settings</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Default Icon</Form.Label>
                          <Form.Control type="file" accept="image/*" />
                          <Form.Text className="text-muted">
                            Recommended size: 192x192px
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Default Badge</Form.Label>
                          <Form.Control type="file" accept="image/*" />
                          <Form.Text className="text-muted">
                            Recommended size: 96x96px
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  <div className="mb-4">
                    <h6 className="mb-3">Delivery Settings</h6>
                    <MDBSwitch 
                      id="quietHours" 
                      label="Enable Quiet Hours" 
                      defaultChecked 
                      className="mb-3"
                    />
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Quiet Hours Start</Form.Label>
                          <Form.Control type="time" defaultValue="22:00" />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Quiet Hours End</Form.Label>
                          <Form.Control type="time" defaultValue="08:00" />
                        </Form.Group>
                      </Col>
                    </Row>
                    <MDBSwitch 
                      id="retryFailed" 
                      label="Automatically retry failed notifications" 
                      defaultChecked 
                      className="mb-3"
                    />
                  </div>
                  <MDBBtn color="primary" onClick={() => setShowAlert(true)}>
                    Save Settings
                  </MDBBtn>
                </Form>
              </MDBTabsPane>

              {/* Team Settings */}
              <MDBTabsPane open={activeTab === 'team'}>
                <h5 className="mb-4">Team Management</h5>
                <div className="mb-3">
                  <Button variant="primary" size="sm" className="mb-3">
                    Invite Team Member
                  </Button>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>John Doe</td>
                          <td>john@example.com</td>
                          <td>Admin</td>
                          <td><span className="badge bg-success">Active</span></td>
                          <td>
                            <Button variant="link" size="sm">Edit</Button>
                          </td>
                        </tr>
                        <tr>
                          <td>Jane Smith</td>
                          <td>jane@example.com</td>
                          <td>Editor</td>
                          <td><span className="badge bg-success">Active</span></td>
                          <td>
                            <Button variant="link" size="sm">Edit</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </MDBTabsPane>

              {/* API Settings */}
              <MDBTabsPane open={activeTab === 'api'}>
                <h5 className="mb-4">API Key Management</h5>
                <Alert variant="info">
                  Use API keys to integrate push notifications into your application.
                </Alert>
                <div className="mb-3">
                  <Button variant="primary" size="sm" className="mb-3">
                    Generate New API Key
                  </Button>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Key</th>
                          <th>Created</th>
                          <th>Last Used</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Production Key</td>
                          <td>
                            <code>pk_live_************</code>
                            <Button variant="link" size="sm">Copy</Button>
                          </td>
                          <td>Jan 1, 2024</td>
                          <td>2 hours ago</td>
                          <td>
                            <Button variant="link" size="sm" className="text-danger">Revoke</Button>
                          </td>
                        </tr>
                        <tr>
                          <td>Test Key</td>
                          <td>
                            <code>pk_test_************</code>
                            <Button variant="link" size="sm">Copy</Button>
                          </td>
                          <td>Jan 5, 2024</td>
                          <td>Yesterday</td>
                          <td>
                            <Button variant="link" size="sm" className="text-danger">Revoke</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </MDBTabsPane>

              {/* Compliance Settings */}
              <MDBTabsPane open={activeTab === 'compliance'}>
                <h5 className="mb-4">Compliance & Privacy</h5>
                <Form>
                  <div className="mb-4">
                    <h6 className="mb-3">GDPR Settings</h6>
                    <MDBSwitch 
                      id="gdprMode" 
                      label="Enable GDPR compliance mode" 
                      defaultChecked 
                      className="mb-3"
                    />
                    <MDBSwitch 
                      id="ipAnonymization" 
                      label="Anonymize IP addresses" 
                      defaultChecked 
                      className="mb-3"
                    />
                    <MDBSwitch 
                      id="autoDelete" 
                      label="Auto-delete inactive subscribers after 180 days" 
                      className="mb-3"
                    />
                    <MDBSwitch 
                      id="doubleOptIn" 
                      label="Require double opt-in for subscriptions" 
                      className="mb-3"
                    />
                    <MDBSwitch 
                      id="cookieConsent" 
                      label="Show cookie consent banner" 
                      defaultChecked 
                      className="mb-3"
                    />
                  </div>

                  <div className="mb-4">
                    <h6 className="mb-3">Data Retention</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Notification History Retention</Form.Label>
                      <Form.Select defaultValue="90">
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">1 year</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Analytics Data Retention</Form.Label>
                      <Form.Select defaultValue="365">
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">1 year</option>
                        <option value="730">2 years</option>
                        <option value="unlimited">Unlimited</option>
                      </Form.Select>
                    </Form.Group>
                  </div>

                  <div className="mb-4">
                    <h6 className="mb-3">Consent Management</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Consent Message</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={3}
                        defaultValue="We'd like to send you push notifications for updates and special offers. You can unsubscribe anytime."
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Privacy Policy URL</Form.Label>
                      <Form.Control 
                        type="url" 
                        placeholder="https://example.com/privacy"
                      />
                    </Form.Group>
                  </div>

                  <div className="mb-4">
                    <h6 className="mb-3">User Rights</h6>
                    <MDBSwitch 
                      id="dataExport" 
                      label="Allow users to export their data" 
                      defaultChecked 
                      className="mb-3"
                    />
                    <MDBSwitch 
                      id="dataDelete" 
                      label="Allow users to request data deletion" 
                      defaultChecked 
                      className="mb-3"
                    />
                    <MDBSwitch 
                      id="dataPortability" 
                      label="Enable data portability (JSON export)" 
                      defaultChecked 
                      className="mb-3"
                    />
                  </div>

                  <div className="mb-4">
                    <h6 className="mb-3">Compliance Reports</h6>
                    <div className="d-flex gap-2">
                      <Button variant="outline-primary" size="sm">
                        Generate GDPR Audit Report
                      </Button>
                      <Button variant="outline-primary" size="sm">
                        Export Data Processing Records
                      </Button>
                    </div>
                  </div>

                  <MDBBtn color="primary" onClick={() => setShowAlert(true)}>
                    Save Compliance Settings
                  </MDBBtn>
                </Form>
              </MDBTabsPane>
            </MDBTabsContent>
          </MDBCardBody>
        </MDBCard>
      </div>
    </DashboardLayout>
  )
}