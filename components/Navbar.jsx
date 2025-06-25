'use client'

import { Navbar, Container, Nav, Button, Badge, Dropdown } from 'react-bootstrap'
import { FiBell, FiMenu, FiUser, FiLogOut } from 'react-icons/fi'
import { useAuth } from '@/app/contexts/AuthContext'

export default function AppNavbar({ onToggleSidebar }) {
  const { userEmail, logout } = useAuth()
  return (
    <Navbar bg="white" expand="lg" fixed="top" className="shadow-sm">
      <Container fluid>
        <div className="d-flex align-items-center">
          <Navbar.Brand href="/dashboard" className="fw-bold">
            Push Notification App
          </Navbar.Brand>
        </div>

        <Nav className="ms-auto d-flex flex-row align-items-center">
          <Nav.Link href="#" className="position-relative me-3">
            <FiBell size={20} />
            <Badge 
              bg="danger" 
              pill 
              className="position-absolute top-0 start-100 translate-middle"
              style={{ fontSize: '0.6rem' }}
            >
              3
            </Badge>
          </Nav.Link>
          <Dropdown align="end">
            <Dropdown.Toggle variant="link" className="text-dark text-decoration-none d-flex align-items-center">
              <FiUser size={20} className="me-2" />
              <span className="d-none d-md-inline">{userEmail || 'Admin User'}</span>
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={logout}>
                <FiLogOut size={16} className="me-2" />
                Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Nav>
      </Container>
    </Navbar>
  )
}