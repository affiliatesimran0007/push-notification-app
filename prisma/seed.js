const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin'
    }
  })
  console.log('✅ Created admin user:', adminUser.email)

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10)
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      name: 'John Doe',
      role: 'user'
    }
  })
  console.log('✅ Created regular user:', regularUser.email)

  // Create templates
  const templates = [
    {
      name: 'Welcome Message',
      category: 'engagement',
      title: 'Welcome to Our Community! 👋',
      message: 'Thanks for subscribing! We\'re excited to have you here. Stay tuned for exclusive updates and special offers.',
      variables: [],
      icon: 'https://cdn-icons-png.flaticon.com/512/2645/2645890.png', // Welcome celebration icon
      userId: adminUser.id
    },
    {
      name: 'Cart Abandonment',
      category: 'ecommerce',
      title: 'You left items in your cart 🛒',
      message: 'Complete your purchase and get 20% off! Your favorite items are waiting for you. This offer expires soon.',
      variables: [],
      icon: 'https://cdn-icons-png.flaticon.com/512/2838/2838895.png', // Shopping cart icon
      userId: adminUser.id
    },
    {
      name: 'New Article',
      category: 'content',
      title: 'New post: Ultimate Guide to Web Push Notifications',
      message: 'Check out our latest article on maximizing engagement with push notifications. Learn tips and best practices!',
      variables: [],
      icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png', // News icon
      userId: adminUser.id
    },
    {
      name: 'Order Shipped',
      category: 'transactional',
      title: 'Your order has been shipped! 📦',
      message: 'Order #12345 is on its way. Track it here. Expected delivery: Tomorrow by 5 PM.',
      variables: [],
      icon: 'https://cdn-icons-png.flaticon.com/512/2927/2927347.png', // Delivery truck icon
      userId: adminUser.id
    },
    {
      name: 'Weekly Newsletter',
      category: 'engagement',
      title: 'Your Weekly Update 📰',
      message: 'Here\'s what you missed this week: New features, trending articles, and exclusive member benefits!',
      variables: [],
      icon: 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png', // News icon
      userId: adminUser.id
    }
  ]

  for (const template of templates) {
    await prisma.template.create({ data: template })
  }
  console.log('✅ Created', templates.length, 'templates')

  // Create sample clients (subscribers)
  const clients = [
    {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sample1',
      p256dh: 'sample_p256dh_key_1',
      auth: 'sample_auth_key_1',
      browser: 'chrome',
      browserVersion: '120.0.0',
      country: 'United States',
      city: 'New York',
      os: 'Windows',
      device: 'desktop',
      subscribedUrl: 'https://example.com',
      tags: ['premium', 'newsletter']
    },
    {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sample2',
      p256dh: 'sample_p256dh_key_2',
      auth: 'sample_auth_key_2',
      browser: 'firefox',
      browserVersion: '121.0',
      country: 'United Kingdom',
      city: 'London',
      os: 'macOS',
      device: 'desktop',
      subscribedUrl: 'https://example.com/blog',
      tags: ['blog', 'updates']
    },
    {
      endpoint: 'https://fcm.googleapis.com/fcm/send/sample3',
      p256dh: 'sample_p256dh_key_3',
      auth: 'sample_auth_key_3',
      browser: 'safari',
      browserVersion: '17.0',
      country: 'Canada',
      city: 'Toronto',
      os: 'iOS',
      device: 'mobile',
      subscribedUrl: 'https://example.com/shop',
      tags: ['customer', 'mobile']
    }
  ]

  for (const client of clients) {
    await prisma.client.create({ data: client })
  }
  console.log('✅ Created', clients.length, 'sample clients')

  // Create a completed campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Welcome Campaign 2024',
      title: '🎉 Welcome to Our Platform!',
      message: 'Thanks for joining us. Check out our latest features!',
      url: 'https://example.com/welcome',
      type: 'engagement',
      status: 'completed',
      sentCount: 1523,
      deliveredCount: 1456,
      clickedCount: 342,
      sentAt: new Date('2024-01-15T10:00:00Z'),
      userId: adminUser.id
    }
  })
  console.log('✅ Created sample campaign')

  // Create segments
  const segments = await prisma.segment.createMany({
    data: [
      {
        name: 'Premium Users',
        description: 'Users with premium subscription',
        rules: { tags: { contains: 'premium' } },
        clientCount: 1
      },
      {
        name: 'Mobile Users',
        description: 'Users on mobile devices',
        rules: { device: 'mobile' },
        clientCount: 1
      },
      {
        name: 'Newsletter Subscribers',
        description: 'Users subscribed to newsletter',
        rules: { tags: { contains: 'newsletter' } },
        clientCount: 1
      }
    ]
  })
  console.log('✅ Created', segments.count, 'segments')

  console.log('')
  console.log('🎉 Seed completed successfully!')
  console.log('')
  console.log('📝 Login credentials:')
  console.log('   Admin: admin@example.com / admin123')
  console.log('   User:  user@example.com / user123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })