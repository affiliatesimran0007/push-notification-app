'use client'

import { Navbar, Container, Nav, Button, Badge } from 'react-bootstrap'
import { FiBell, FiMenu, FiUser } from 'react-icons/fi'

export default function AppNavbar({ onToggleSidebar }) {
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
          <Nav.Link href="#" className="d-flex align-items-center">
            <FiUser size={20} className="me-2" />
            <span className="d-none d-md-inline">Admin User</span>
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  )
}