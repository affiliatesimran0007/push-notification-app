import { createHmac, randomBytes } from 'crypto'
import { NextResponse } from 'next/server'

// OPTIONS — preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

// GET /api/analytics/session
// Issues a time-bound HMAC challenge token.
// Looks like a standard analytics session-init call.
export async function GET() {
  const secret = process.env.CHALLENGE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 })
  }

  // Nonce = 8-hex seconds timestamp + 8 random hex chars
  // Server can extract issue time from the nonce (stateless timing validation)
  const ts = Math.floor(Date.now() / 1000)
  const rand = randomBytes(4).toString('hex')
  const nonce = ts.toString(16).padStart(8, '0') + rand

  // Token covers the 5-min window the nonce belongs to
  const window = Math.floor(ts / 300)
  const token = createHmac('sha256', secret)
    .update(`${window}:${nonce}`)
    .digest('hex')
    .slice(0, 32)

  return NextResponse.json(
    { s: token, n: nonce },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    }
  )
}
