import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Check if users exist
    const userCount = await prisma.user.count()
    console.log('User count:', userCount)
    
    // Check if campaigns exist
    const campaignCount = await prisma.campaign.count()
    console.log('Campaign count:', campaignCount)
    
    // Try to get a campaign without user include
    const campaignWithoutUser = await prisma.campaign.findFirst()
    console.log('Campaign without user:', campaignWithoutUser)
    
    // Try to get a campaign with user include
    let campaignWithUser = null
    let userError = null
    try {
      campaignWithUser = await prisma.campaign.findFirst({
        include: {
          user: true
        }
      })
    } catch (error) {
      userError = error.message
    }
    
    return NextResponse.json({
      userCount,
      campaignCount,
      campaignWithoutUser,
      campaignWithUser,
      userError,
      hasCampaignUserField: campaignWithoutUser ? 'userId' in campaignWithoutUser : null
    })
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}