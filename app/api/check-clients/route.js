import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import webPushService from '@/lib/webPushService'

// GET /api/check-clients - Check client subscription validity
export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    // Get all clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        browser: true,
        os: true,
        endpoint: true,
        p256dh: true,
        auth: true,
        accessStatus: true,
        createdAt: true
      }
    })

    // Check each client's subscription validity
    const clientAnalysis = clients.map(client => {
      const analysis = {
        id: client.id,
        browser: client.browser,
        os: client.os,
        accessStatus: client.accessStatus,
        createdAt: client.createdAt,
        issues: []
      }

      // Check endpoint
      if (!client.endpoint) {
        analysis.issues.push('No endpoint')
      } else if (client.endpoint.includes('demo') || client.endpoint.includes('sample')) {
        analysis.issues.push('Demo/test endpoint')
      } else if (!client.endpoint.startsWith('https://')) {
        analysis.issues.push('Invalid endpoint format')
      }

      // Check keys
      if (!client.p256dh || !client.auth) {
        analysis.issues.push('Missing subscription keys')
      } else if (client.p256dh.includes('sample') || client.auth.includes('sample')) {
        analysis.issues.push('Sample/test keys')
      } else if (client.p256dh.length < 20 || client.auth.length < 10) {
        analysis.issues.push('Keys too short')
      }

      // Check if subscription is valid using webPushService
      const subscription = {
        endpoint: client.endpoint,
        keys: {
          p256dh: client.p256dh,
          auth: client.auth
        }
      }
      
      analysis.isValidSubscription = webPushService.isValidSubscription(subscription)
      analysis.endpointType = 
        client.endpoint?.includes('fcm.googleapis.com') ? 'FCM (Chrome/Edge)' :
        client.endpoint?.includes('mozilla.com') ? 'Mozilla (Firefox)' :
        client.endpoint?.includes('windows.com') ? 'WNS (Edge)' :
        client.endpoint?.includes('apple.com') ? 'Apple (Safari)' :
        'Unknown'

      return analysis
    })

    const summary = {
      totalClients: clients.length,
      validClients: clientAnalysis.filter(c => c.isValidSubscription && c.issues.length === 0).length,
      clientsWithIssues: clientAnalysis.filter(c => c.issues.length > 0).length,
      commonIssues: {}
    }

    // Count common issues
    clientAnalysis.forEach(client => {
      client.issues.forEach(issue => {
        summary.commonIssues[issue] = (summary.commonIssues[issue] || 0) + 1
      })
    })

    return NextResponse.json({
      summary,
      clients: clientAnalysis
    }, { headers })
  } catch (error) {
    console.error('Client check error:', error)
    return NextResponse.json({
      error: 'Failed to check clients',
      details: error.message
    }, { status: 500, headers })
  }
}

// OPTIONS handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}