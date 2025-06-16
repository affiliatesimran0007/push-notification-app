import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Count users
    const userCount = await prisma.user.count()
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@example.com' }
    })
    
    // Get all users (limit 5 for security)
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
    
    // Count templates
    const templateCount = await prisma.template.count()
    
    // Database URL (masked for security)
    const dbUrl = process.env.DATABASE_URL
    const maskedUrl = dbUrl ? 
      dbUrl.replace(/:[^:@]+@/, ':****@').substring(0, 80) + '...' : 
      'Not set'
    
    return NextResponse.json({
      database: {
        url: maskedUrl,
        connected: true
      },
      users: {
        total: userCount,
        adminExists: !!adminUser,
        adminEmail: adminUser?.email,
        list: users
      },
      templates: {
        total: templateCount
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        vercel: process.env.VERCEL ? 'true' : 'false'
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Database connection failed',
      message: error.message,
      database: {
        url: process.env.DATABASE_URL ? 'Set but connection failed' : 'Not set'
      }
    }, { status: 500 })
  }
}