import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    
    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 })
    }
    
    // Clean domain (remove protocol, www, trailing slash)
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
    
    // Find landing page by domain
    const landingPage = await prisma.landingPage.findFirst({
      where: {
        OR: [
          { domain: cleanDomain },
          { domain: `www.${cleanDomain}` },
          { domain: domain } // Try exact match too
        ]
      }
    })
    
    if (!landingPage) {
      return NextResponse.json({ error: 'Landing page not found for this domain' }, { status: 404 })
    }
    
    return NextResponse.json(landingPage)
    
  } catch (error) {
    console.error('Error fetching landing page by domain:', error)
    return NextResponse.json({ error: 'Failed to fetch landing page' }, { status: 500 })
  }
}