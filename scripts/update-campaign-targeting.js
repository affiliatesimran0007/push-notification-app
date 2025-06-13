import prisma from '../lib/db.js'

async function updateCampaignTargeting() {
  try {
    // Get all campaigns
    const campaigns = await prisma.campaign.findMany({
      take: 3 // Update first 3 campaigns for testing
    })

    if (campaigns.length > 0) {
      // Update first campaign with specific browsers
      await prisma.campaign.update({
        where: { id: campaigns[0].id },
        data: {
          variantA: {
            ...campaigns[0].variantA,
            targetBrowsers: {
              all: false,
              chrome: true,
              firefox: true,
              edge: false,
              safari: false,
              opera: false
            },
            targetSystems: {
              all: false,
              windows: true,
              macos: true,
              linux: false,
              android: false,
              ios: false
            }
          }
        }
      })
      console.log(`Updated campaign ${campaigns[0].name} with Chrome/Firefox browsers and Windows/macOS systems`)
    }

    if (campaigns.length > 1) {
      // Update second campaign with different browsers
      await prisma.campaign.update({
        where: { id: campaigns[1].id },
        data: {
          variantA: {
            ...campaigns[1].variantA,
            targetBrowsers: {
              all: false,
              chrome: false,
              firefox: false,
              edge: true,
              safari: true,
              opera: false
            },
            targetSystems: {
              all: false,
              windows: false,
              macos: true,
              linux: false,
              android: true,
              ios: true
            }
          }
        }
      })
      console.log(`Updated campaign ${campaigns[1].name} with Edge/Safari browsers and macOS/Android/iOS systems`)
    }

    if (campaigns.length > 2) {
      // Update third campaign with single browser/OS
      await prisma.campaign.update({
        where: { id: campaigns[2].id },
        data: {
          variantA: {
            ...campaigns[2].variantA,
            targetBrowsers: {
              all: false,
              chrome: true,
              firefox: false,
              edge: false,
              safari: false,
              opera: false
            },
            targetSystems: {
              all: false,
              windows: false,
              macos: false,
              linux: true,
              android: false,
              ios: false
            }
          }
        }
      })
      console.log(`Updated campaign ${campaigns[2].name} with Chrome browser and Linux system`)
    }

    console.log('Campaign targeting updated successfully!')
  } catch (error) {
    console.error('Error updating campaigns:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateCampaignTargeting()