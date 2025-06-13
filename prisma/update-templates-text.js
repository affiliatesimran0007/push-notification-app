const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateTemplates() {
  try {
    console.log('🔄 Updating template texts...')

    const updates = [
      {
        name: 'Welcome Message',
        title: 'Welcome to Our Community! 👋',
        message: 'Thanks for subscribing! We\'re excited to have you here. Stay tuned for exclusive updates and special offers.',
        variables: []
      },
      {
        name: 'Cart Abandonment',
        title: 'You left items in your cart 🛒',
        message: 'Complete your purchase and get 20% off! Your favorite items are waiting for you. This offer expires soon.',
        variables: []
      },
      {
        name: 'New Article',
        title: 'New post: Ultimate Guide to Web Push Notifications',
        message: 'Check out our latest article on maximizing engagement with push notifications. Learn tips and best practices!',
        variables: []
      },
      {
        name: 'Order Shipped',
        title: 'Your order has been shipped! 📦',
        message: 'Order #12345 is on its way. Track it here. Expected delivery: Tomorrow by 5 PM.',
        variables: []
      },
      {
        name: 'Weekly Newsletter',
        title: 'Your Weekly Update 📰',
        message: 'Here\'s what you missed this week: New features, trending articles, and exclusive member benefits!',
        variables: []
      }
    ]

    for (const update of updates) {
      const result = await prisma.template.updateMany({
        where: { name: update.name },
        data: {
          title: update.title,
          message: update.message,
          variables: update.variables
        }
      })
      
      if (result.count > 0) {
        console.log(`✅ Updated "${update.name}"`)
      } else {
        console.log(`⚠️  No template found with name "${update.name}"`)
      }
    }

    console.log('\n✨ Template text update completed!')
  } catch (error) {
    console.error('Error updating templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateTemplates()