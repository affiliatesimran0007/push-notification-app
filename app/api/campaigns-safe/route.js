import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Use raw query to avoid schema issues
    const campaigns = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.title,
        c.message,
        c.url,
        c.icon,
        c.badge,
        c.image,
        c.type,
        c.status,
        c."targetAudience",
        c."sentCount",
        c."deliveredCount",
        c."clickedCount",
        c."failedCount",
        COALESCE(c."dismissedCount", 0) as "dismissedCount",
        COALESCE(c."pendingCount", 0) as "pendingCount",
        c."scheduledFor",
        c."sentAt",
        c."createdAt",
        c."updatedAt",
        c."abTestEnabled",
        c."variantA",
        c."variantB",
        c."trafficSplit",
        c."userId",
        u.name as "userName",
        u.email as "userEmail"
      FROM "Campaign" c
      LEFT JOIN "User" u ON c."userId" = u.id
      ${status ? prisma.Prisma.sql`WHERE c.status = ${status}` : prisma.Prisma.sql``}
      ORDER BY 
        CASE WHEN c.status = 'draft' THEN 0 ELSE 1 END,
        c."sentAt" DESC NULLS LAST,
        c."scheduledFor" DESC NULLS LAST,
        c."createdAt" DESC
      LIMIT ${limit} OFFSET ${skip}
    `

    // Count total
    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Campaign"
      ${status ? prisma.Prisma.sql`WHERE status = ${status}` : prisma.Prisma.sql``}
    `
    const total = Number(totalResult[0].count)

    // Format campaigns
    const formattedCampaigns = campaigns.map(c => ({
      ...c,
      dismissedCount: Number(c.dismissedCount || 0),
      pendingCount: Number(c.pendingCount || 0),
      sentCount: Number(c.sentCount || 0),
      deliveredCount: Number(c.deliveredCount || 0),
      clickedCount: Number(c.clickedCount || 0),
      failedCount: Number(c.failedCount || 0),
      ctr: c.sentCount > 0 ? ((c.clickedCount / c.sentCount) * 100).toFixed(1) : 0,
      user: {
        name: c.userName,
        email: c.userEmail
      },
      abTest: {
        enabled: c.abTestEnabled,
        variantA: c.variantA,
        variantB: c.variantB,
        trafficSplit: c.trafficSplit
      }
    }))

    return NextResponse.json({
      campaigns: formattedCampaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaigns',
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    )
  }
}