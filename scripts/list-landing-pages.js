const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Fetching all landing pages...\n')
  
  try {
    const landingPages = await prisma.landingPage.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Found ${landingPages.length} landing pages:\n`)
    
    landingPages.forEach((page, index) => {
      console.log(`${index + 1}. Landing Page:`)
      console.log(`   ID: ${page.id}`)
      console.log(`   Name: ${page.name}`)
      console.log(`   Domain: ${page.domain}`)
      console.log(`   Landing ID: ${page.landingId}`)
      console.log(`   Status: ${page.status}`)
      console.log(`   Bot Protection: ${page.botProtection}`)
      console.log(`   Created: ${page.createdAt}`)
      console.log(`   ---`)
    })
    
    // Specifically look for alerts-intuit.com
    const alertsIntuitPage = landingPages.find(page => 
      page.domain === 'alerts-intuit.com' || 
      page.landingId === 'alerts-intuit-main' ||
      page.name.toLowerCase().includes('intuit')
    )
    
    if (alertsIntuitPage) {
      console.log('\n✅ Found alerts-intuit.com landing page:')
      console.log(`   Landing ID: ${alertsIntuitPage.landingId}`)
      console.log(`   Status: ${alertsIntuitPage.status}`)
    } else {
      console.log('\n❌ No landing page found for alerts-intuit.com')
    }
    
  } catch (error) {
    console.error('Error fetching landing pages:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })