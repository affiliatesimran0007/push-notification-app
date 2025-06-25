'use client'

import { useState, useEffect } from 'react'
import AppNavbar from './Navbar'
import Sidebar from './Sidebar'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'

export default function DashboardLayout({ children }) {
  // Initialize state from localStorage if available
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('sidebarCollapsed')
      return savedState !== null ? JSON.parse(savedState) : false
    }
    return false
  })

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    // Save to localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
  }

  return (
    <ProtectedRoute>
      <AppNavbar onToggleSidebar={toggleSidebar} />
      <div className="main-layout">
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="container-fluid p-3 p-md-4">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}