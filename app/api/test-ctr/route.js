import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/test-ctr - Test CTR calculation
export async function GET(request) {
  try {
    // Get a campaign with some sent notifications
    const campaign = await prisma.campaign.findFirst({
      where: {
        sentCount: { gt: 0 }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    if (!campaign) {
      return NextResponse.json({ error: 'No campaigns with sent notifications found' }, { status: 404 })
    }
    
    // Test different CTR scenarios
    const scenarios = [
      {
        name: 'No clicks',
        sentCount: 10,
        clickedCount: 0,
        expectedCTR: '0.0'
      },
      {
        name: 'Some clicks',
        sentCount: 10,
        clickedCount: 3,
        expectedCTR: '30.0'
      },
      {
        name: 'All clicked',
        sentCount: 5,
        clickedCount: 5,
        expectedCTR: '100.0'
      },
      {
        name: 'Fractional CTR',
        sentCount: 7,
        clickedCount: 1,
        expectedCTR: '14.3'
      }
    ]
    
    const results = scenarios.map(scenario => {
      const calculatedCTR = scenario.sentCount > 0
        ? ((scenario.clickedCount / scenario.sentCount) * 100).toFixed(1)
        : '0.0'
      
      return {
        ...scenario,
        calculatedCTR,
        passed: calculatedCTR === scenario.expectedCTR
      }
    })
    
    // Test actual campaign CTR
    const actualCTR = campaign.sentCount > 0
      ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1)
      : '0.0'
    
    return NextResponse.json({
      tests: results,
      allPassed: results.every(r => r.passed),
      actualCampaign: {
        id: campaign.id,
        name: campaign.name,
        sentCount: campaign.sentCount,
        clickedCount: campaign.clickedCount,
        calculatedCTR: actualCTR,
        apiEndpoint: `/api/campaigns/${campaign.id}/stats`
      }
    })
  } catch (error) {
    console.error('Test CTR error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    )
  }
}