import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/landing - Get all landing pages
export async function GET() {
  try {
    const landingPages = await prisma.landingPage.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { clients: true }
        }
      }
    })

    // Transform the data to match frontend expectations
    const transformedPages = landingPages.map(page => ({
      id: page.id,
      name: page.name,
      url: `https://${page.domain}`,
      domain: page.domain,
      landingId: page.landingId,
      status: page.status,
      subscribers: page._count.clients,
      created: page.createdAt.toISOString().split('T')[0],
      lastModified: page.updatedAt.toISOString().split('T')[0],
      enableRedirect: page.enableRedirect,
      allowRedirectUrl: page.allowRedirectUrl || '',
      blockRedirectUrl: page.blockRedirectUrl || '',
      botProtection: page.botProtection
    }))

    return NextResponse.json(transformedPages)
  } catch (error) {
    console.error('Error fetching landing pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch landing pages' },
      { status: 500 }
    )
  }
}

// POST /api/landing - Create a new landing page
export async function POST(request) {
  try {
    const body = await request.json()
    const { name, domain, landingId, botProtection, allowRedirectUrl, blockRedirectUrl } = body

    // Validate required fields
    if (!name || !domain || !landingId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, domain, landingId' },
        { status: 400 }
      )
    }

    // Clean up domain
    const cleanDomain = domain.trim()
      .replace('https://', '')
      .replace('http://', '')
      .replace(/\/$/, '') // Remove trailing slash

    // Check if domain or landingId already exists
    const existing = await prisma.landingPage.findFirst({
      where: {
        OR: [
          { domain: cleanDomain },
          { landingId: landingId }
        ]
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A landing page with this domain or landing ID already exists' },
        { status: 409 }
      )
    }

    // Create landing page
    const landingPage = await prisma.landingPage.create({
      data: {
        name,
        domain: cleanDomain,
        landingId,
        botProtection: botProtection ?? true,
        enableRedirect: !!allowRedirectUrl || !!blockRedirectUrl,
        allowRedirectUrl: allowRedirectUrl || null,
        blockRedirectUrl: blockRedirectUrl || null,
        status: 'active'
      },
      include: {
        _count: {
          select: { clients: true }
        }
      }
    })

    // Transform response
    const response = {
      id: landingPage.id,
      name: landingPage.name,
      url: `https://${landingPage.domain}`,
      domain: landingPage.domain,
      landingId: landingPage.landingId,
      status: landingPage.status,
      subscribers: landingPage._count.clients,
      created: landingPage.createdAt.toISOString().split('T')[0],
      lastModified: landingPage.updatedAt.toISOString().split('T')[0],
      enableRedirect: landingPage.enableRedirect,
      allowRedirectUrl: landingPage.allowRedirectUrl || '',
      blockRedirectUrl: landingPage.blockRedirectUrl || '',
      botProtection: landingPage.botProtection
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating landing page:', error)
    return NextResponse.json(
      { error: 'Failed to create landing page' },
      { status: 500 }
    )
  }
}

// PUT /api/landing - Update a landing page
export async function PUT(request) {
  try {
    const body = await request.json()
    const { id, name, status, botProtection, allowRedirectUrl, blockRedirectUrl } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Landing page ID is required' },
        { status: 400 }
      )
    }

    const landingPage = await prisma.landingPage.update({
      where: { id },
      data: {
        name: name || undefined,
        status: status || undefined,
        botProtection: botProtection !== undefined ? botProtection : undefined,
        enableRedirect: (allowRedirectUrl || blockRedirectUrl) ? true : undefined,
        allowRedirectUrl: allowRedirectUrl !== undefined ? (allowRedirectUrl || null) : undefined,
        blockRedirectUrl: blockRedirectUrl !== undefined ? (blockRedirectUrl || null) : undefined
      },
      include: {
        _count: {
          select: { clients: true }
        }
      }
    })

    // Transform response
    const response = {
      id: landingPage.id,
      name: landingPage.name,
      url: `https://${landingPage.domain}`,
      domain: landingPage.domain,
      landingId: landingPage.landingId,
      status: landingPage.status,
      subscribers: landingPage._count.clients,
      created: landingPage.createdAt.toISOString().split('T')[0],
      lastModified: landingPage.updatedAt.toISOString().split('T')[0],
      enableRedirect: landingPage.enableRedirect,
      allowRedirectUrl: landingPage.allowRedirectUrl || '',
      blockRedirectUrl: landingPage.blockRedirectUrl || '',
      botProtection: landingPage.botProtection
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating landing page:', error)
    return NextResponse.json(
      { error: 'Failed to update landing page' },
      { status: 500 }
    )
  }
}

// DELETE /api/landing - Delete a landing page
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Landing page ID is required' },
        { status: 400 }
      )
    }

    await prisma.landingPage.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting landing page:', error)
    return NextResponse.json(
      { error: 'Failed to delete landing page' },
      { status: 500 }
    )
  }
}