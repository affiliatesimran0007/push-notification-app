import { NextResponse } from 'next/server'

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    vapidConfigured: {
      hasPublicKey: !!publicKey,
      hasPrivateKey: !!privateKey,
      hasSubject: !!subject,
      publicKeyPrefix: publicKey ? publicKey.substring(0, 10) + '...' : 'NOT SET',
      privateKeyPrefix: privateKey ? privateKey.substring(0, 10) + '...' : 'NOT SET',
      subject: subject || 'NOT SET'
    },
    expectedPublicKey: 'BNV70f-uHI...',
    actualPublicKey: publicKey ? publicKey.substring(0, 10) + '...' : 'NOT SET',
    keysMatch: publicKey && publicKey.startsWith('BNV70f-uHI')
  })
}