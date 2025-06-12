const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Creating landing page for alerts-intuit.com...')
  
  try {
    const landingPage = await prisma.landingPage.create({
      data: {
        name: 'Alerts Intuit',
        domain: 'alerts-intuit.com',
        landingId: 'alerts-intuit-main',
        status: 'active',
        botProtection: true,
        enableRedirect: true,
        allowRedirectUrl: 'https://alerts-intuit.com/thank-you',
        blockRedirectUrl: 'https://alerts-intuit.com/notifications-blocked'
      }
    })
    
    console.log('Successfully created landing page:', landingPage)
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Landing page for alerts-intuit.com already exists')
    } else {
      console.error('Error creating landing page:', error)
    }
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