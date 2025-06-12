'use client'

import { useState } from 'react'
import {
  MDBCard,
  MDBCardBody,
  MDBCardHeader,
  MDBIcon,
  MDBProgress,
  MDBProgressBar
} from 'mdb-react-ui-kit'
import { Row, Col, Card, Form } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import DashboardLayout from '@/components/DashboardLayout'
import { mockAnalytics } from '@/lib/data/mockData'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function Analytics() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)),
    endDate: new Date()
  })

  // Line chart data for daily stats
  const lineChartData = {
    labels: mockAnalytics.dailyStats.map(stat => 
      new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Notifications Sent',
        data: mockAnalytics.dailyStats.map(stat => stat.sent),
        borderColor: 'rgb(13, 110, 253)',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Clicks',
        data: mockAnalytics.dailyStats.map(stat => stat.clicks),
        borderColor: 'rgb(25, 135, 84)',
        backgroundColor: 'rgba(25, 135, 84, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  }

  // Doughnut chart data for device breakdown
  const doughnutChartData = {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [
      {
        data: [
          mockAnalytics.deviceBreakdown.desktop,
          mockAnalytics.deviceBreakdown.mobile,
          mockAnalytics.deviceBreakdown.tablet
        ],
        backgroundColor: [
          'rgb(13, 110, 253)',
          'rgb(25, 135, 84)',
          'rgb(255, 193, 7)'
        ],
        borderWidth: 0,
      }
    ]
  }

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  }

  // Bar chart data for browser breakdown
  const barChartData = {
    labels: ['Chrome', 'Safari', 'Firefox', 'Edge'],
    datasets: [
      {
        label: 'Browser Usage %',
        data: [
          mockAnalytics.browserBreakdown.chrome,
          mockAnalytics.browserBreakdown.safari,
          mockAnalytics.browserBreakdown.firefox,
          mockAnalytics.browserBreakdown.edge
        ],
        backgroundColor: [
          'rgba(13, 110, 253, 0.8)',
          'rgba(108, 117, 125, 0.8)',
          'rgba(255, 87, 34, 0.8)',
          'rgba(13, 202, 240, 0.8)'
        ],
      }
    ]
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">Analytics</h1>
          <div className="d-flex align-items-center gap-3">
            <Form.Group className="mb-0">
              <DatePicker
                selectsRange
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={(dates) => {
                  const [start, end] = dates
                  setDateRange({ startDate: start, endDate: end })
                }}
                className="form-control"
                placeholderText="Select date range"
              />
            </Form.Group>
          </div>
        </div>

        {/* Key Metrics */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-4">
            <MDBCard className="shadow-sm h-100">
              <MDBCardBody className="text-center">
                <div className="mb-3">
                  <MDBIcon fas icon="users" size="2x" className="text-primary" />
                </div>
                <h5 className="mb-1">{mockAnalytics.overview.totalSubscribers.toLocaleString()}</h5>
                <p className="text-muted mb-0">Total Subscribers</p>
                <small className="text-success">
                  <MDBIcon fas icon="arrow-up" /> {mockAnalytics.overview.subscriberGrowth}%
                </small>
              </MDBCardBody>
            </MDBCard>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <MDBCard className="shadow-sm h-100">
              <MDBCardBody className="text-center">
                <div className="mb-3">
                  <MDBIcon fas icon="user-check" size="2x" className="text-success" />
                </div>
                <h5 className="mb-1">{mockAnalytics.overview.activeSubscribers.toLocaleString()}</h5>
                <p className="text-muted mb-0">Active Subscribers</p>
                <small className="text-muted">80.1% of total</small>
              </MDBCardBody>
            </MDBCard>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <MDBCard className="shadow-sm h-100">
              <MDBCardBody className="text-center">
                <div className="mb-3">
                  <MDBIcon fas icon="paper-plane" size="2x" className="text-info" />
                </div>
                <h5 className="mb-1">{mockAnalytics.overview.totalNotificationsSent.toLocaleString()}</h5>
                <p className="text-muted mb-0">Notifications Sent</p>
                <small className="text-muted">This month</small>
              </MDBCardBody>
            </MDBCard>
          </Col>
          <Col lg={3} md={6} className="mb-4">
            <MDBCard className="shadow-sm h-100">
              <MDBCardBody className="text-center">
                <div className="mb-3">
                  <MDBIcon fas icon="mouse-pointer" size="2x" className="text-warning" />
                </div>
                <h5 className="mb-1">{mockAnalytics.overview.averageCtr}%</h5>
                <p className="text-muted mb-0">Average CTR</p>
                <small className="text-success">Industry avg: 22%</small>
              </MDBCardBody>
            </MDBCard>
          </Col>
        </Row>

        {/* Charts */}
        <Row className="mb-4">
          <Col lg={8} className="mb-4">
            <MDBCard className="shadow-sm h-100">
              <MDBCardHeader className="bg-white">
                <h5 className="mb-0">Notification Performance</h5>
              </MDBCardHeader>
              <MDBCardBody>
                <div className="chart-container">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </MDBCardBody>
            </MDBCard>
          </Col>
          <Col lg={4} className="mb-4">
            <MDBCard className="shadow-sm h-100">
              <MDBCardHeader className="bg-white">
                <h5 className="mb-0">Device Distribution</h5>
              </MDBCardHeader>
              <MDBCardBody>
                <div className="chart-container">
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                </div>
              </MDBCardBody>
            </MDBCard>
          </Col>
        </Row>

        <Row>
          <Col lg={6} className="mb-4">
            <MDBCard className="shadow-sm h-100">
              <MDBCardHeader className="bg-white">
                <h5 className="mb-0">Browser Usage</h5>
              </MDBCardHeader>
              <MDBCardBody>
                <div className="chart-container">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </MDBCardBody>
            </MDBCard>
          </Col>
          <Col lg={6} className="mb-4">
            <MDBCard className="shadow-sm h-100">
              <MDBCardHeader className="bg-white">
                <h5 className="mb-0">Top Countries</h5>
              </MDBCardHeader>
              <MDBCardBody>
                {mockAnalytics.topCountries.map((country, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{country.country}</span>
                      <span className="fw-medium">{country.percentage}%</span>
                    </div>
                    <MDBProgress height="8">
                      <MDBProgressBar 
                        width={country.percentage} 
                        valuemin={0} 
                        valuemax={100}
                        bgColor={index === 0 ? 'primary' : index === 1 ? 'success' : 'info'}
                      />
                    </MDBProgress>
                  </div>
                ))}
              </MDBCardBody>
            </MDBCard>
          </Col>
        </Row>
      </div>
    </DashboardLayout>
  )
}