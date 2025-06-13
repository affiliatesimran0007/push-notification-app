import prisma from '../lib/db.js'

async function addPausedCampaign() {
  try {
    // Get the admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (!adminUser) {
      console.error('No admin user found')
      return
    }

    // Create a paused campaign
    const pausedCampaign = await prisma.campaign.create({
      data: {
        name: 'Summer Sale Campaign',
        type: 'promotional',
        status: 'paused',
        title: '☀️ Summer Sale - 30% OFF!',
        message: 'Beat the heat with cool deals. Shop summer essentials now!',
        url: 'https://example.com/summer-sale',
        icon: 'https://cdn-icons-png.flaticon.com/512/1163/1163624.png',
        badge: '/badge-72x72.png',
        targetAudience: 'all',
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
        sentCount: 2500,
        deliveredCount: 2300,
        clickedCount: 450,
        failedCount: 50,
        userId: adminUser.id,
        abTestEnabled: false,
        variantA: {
          targetBrowsers: {
            all: true
          },
          targetSystems: {
            all: true
          }
        }
      }
    })

    console.log('Created paused campaign:', pausedCampaign.name)
  } catch (error) {
    console.error('Error creating paused campaign:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addPausedCampaign()