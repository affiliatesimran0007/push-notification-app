import { NextResponse } from 'next/server'

// GET /api/proxy?u=<base64url>
// Server fetches destination page and returns HTML.
// Client wraps it in a blob iframe — destination URL never appears in source or network tab.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const encoded = searchParams.get('u')
    if (!encoded) return new NextResponse('', { status: 404 })

    let destUrl
    try {
      destUrl = atob(encoded)
    } catch {
      return new NextResponse('', { status: 404 })
    }

    if (!/^https?:\/\//i.test(destUrl)) {
      return new NextResponse('', { status: 404 })
    }

    const res = await fetch(destUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    })

    let html = await res.text()

    // Inject <base href> so all relative paths (CSS, JS, images, links) resolve correctly
    const baseHref = `<base href="${destUrl}" target="_top">`
    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head([^>]*)>/i, `<head$1>${baseHref}`)
    } else {
      html = baseHref + html
    }

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    // Silently fail — push-page.js will fall back to direct redirect
    return new NextResponse('', { status: 502 })
  }
}
