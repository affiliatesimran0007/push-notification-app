'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Nav } from 'react-bootstrap'
import { 
  FiHome, 
  FiUsers, 
  FiBell, 
  FiBarChart2, 
  FiSettings,
  FiDollarSign,
  FiChevronDown,
  FiChevronRight,
  FiChevronLeft,
  FiTool,
  FiFileText,
  FiSend,
  FiGlobe,
  FiLink
} from 'react-icons/fi'

export default function Sidebar({ isCollapsed, onToggle }) {
  const pathname = usePathname()
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(
    pathname.startsWith('/notifications')
  )

  const navItems = [
    { href: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { href: '/landing', icon: FiGlobe, label: 'Landing' },
    { href: '/clients', icon: FiUsers, label: 'Clients' },
    { 
      href: '/notifications', 
      icon: FiBell, 
      label: 'Notifications',
      hasDropdown: true,
      dropdownItems: [
        { href: '/notifications/campaign-builder', icon: FiTool, label: 'Campaign Builder' },
        { href: '/notifications/templates', icon: FiFileText, label: 'Push Templates' },
        { href: '/notifications/campaigns', icon: FiSend, label: 'Push Campaigns' }
      ]
    },
    { href: '/analytics', icon: FiBarChart2, label: 'Analytics' },
    { href: '/integrations', icon: FiLink, label: 'Integrations' },
    { href: '/settings', icon: FiSettings, label: 'Settings' },
    { href: '/billing', icon: FiDollarSign, label: 'Billing' },
    { href: '/test-push', icon: FiBell, label: 'Test Push' },
  ]

  const isNotificationActive = pathname.startsWith('/notifications')

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle-wrapper">
        <button 
          className="sidebar-toggle-btn"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? (
            <FiChevronRight size={18} />
          ) : (
            <>
              <FiChevronLeft size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
      <Nav className="flex-column sidebar-nav pt-3 pb-5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.hasDropdown && pathname.startsWith(item.href))
          
          if (item.hasDropdown) {
            return (
              <Nav.Item key={item.href}>
                <div
                  className={`nav-link d-flex align-items-center justify-content-between ${isActive ? 'active' : ''}`}
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center">
                    <Icon size={20} className="me-3 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {!isCollapsed && (
                    showNotificationsDropdown ? (
                      <FiChevronDown size={16} />
                    ) : (
                      <FiChevronRight size={16} />
                    )
                  )}
                </div>
                {showNotificationsDropdown && !isCollapsed && (
                  <div className="ms-4">
                    {item.dropdownItems.map((dropdownItem) => {
                      const DropdownIcon = dropdownItem.icon
                      return (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className={`nav-link d-flex align-items-center ps-3 ${
                            pathname === dropdownItem.href ? 'active' : ''
                          }`}
                        >
                          <DropdownIcon size={16} className="me-3 flex-shrink-0" />
                          <span style={{ fontSize: '0.9rem' }}>{dropdownItem.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </Nav.Item>
            )
          }
          
          return (
            <Nav.Item key={item.href}>
              <Link 
                href={item.href} 
                className={`nav-link d-flex align-items-center ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} className="me-3 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            </Nav.Item>
          )
        })}
      </Nav>
    </aside>
  )
}