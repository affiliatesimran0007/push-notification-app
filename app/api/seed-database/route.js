import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcryptjs from 'bcryptjs'

// GET /api/seed-database - Seed complete database with admin user and templates
export async function GET(request) {
  try {
    // Check for secret key to prevent unauthorized seeding
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    
    // Use environment variable for security, with fallback for development
    const expectedSecret = process.env.SEED_SECRET || 'your-secret-key-123'
    
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide the correct secret.' },
        { status: 401 }
      )
    }

    const results = {
      adminUser: null,
      templates: 0,
      landingPages: 0
    }

    // 1. Create or get admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (!adminUser) {
      const hashedPassword = await bcryptjs.hash('admin123', 10)
      
      adminUser = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin'
        }
      })
      results.adminUser = 'created'
    } else {
      results.adminUser = 'exists'
    }

    // 2. Create templates if they don't exist
    const existingTemplates = await prisma.template.findMany()
    if (existingTemplates.length === 0) {
      const templates = [
        {
          name: 'Order Shipped',
          category: 'transactional',
          title: 'Your order has been shipped! 📦',
          message: 'Order #12345 is on its way. Track it here. Expected delivery: Tomorrow by 5 PM.',
          variables: [],
          icon: 'https://cdn-icons-png.flaticon.com/512/2927/2927347.png'
        },
        {
          name: 'Cart Abandonment',
          category: 'ecommerce',
          title: "Don't forget your items! 🛒",
          message: 'You left 3 items worth $89.99 in your cart. Complete your order now and get 10% off!',
          variables: [],
          icon: 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png'
        },
        {
          name: 'Flash Sale',
          category: 'ecommerce',
          title: '⚡ Flash Sale - 50% OFF Everything!',
          message: 'Hurry! Sale ends in 2 hours. Use code FLASH50. Shop your favorites now!',
          variables: [],
          icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176215.png'
        },
        {
          name: 'New Article',
          category: 'content',
          title: 'New post: "10 Tips for Better Sleep" 📖',
          message: 'Dr. Sarah Johnson shares proven techniques for improving your sleep quality. Read now!',
          variables: [],
          icon: 'https://cdn-icons-png.flaticon.com/512/2593/2593549.png'
        },
        {
          name: 'Welcome Series',
          category: 'engagement',
          title: 'Welcome to our community! 🎉',
          message: 'Thanks for joining! Here\'s your exclusive 20% off coupon: WELCOME20',
          variables: [],
          icon: 'https://cdn-icons-png.flaticon.com/512/2107/2107845.png'
        },
        {
          name: 'Price Drop Alert',
          category: 'ecommerce',
          title: '💰 Price Drop on Your Wishlist!',
          message: 'Nike Air Max is now $79.99 (was $120). Limited stock available!',
          variables: [],
          icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176366.png'
        },
        {
          name: 'Appointment Reminder',
          category: 'transactional',
          title: 'Appointment Tomorrow at 2:00 PM 📅',
          message: 'Your appointment with Dr. Smith is confirmed for tomorrow at 2:00 PM.',
          variables: [],
          icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693710.png'
        },
        {
          name: 'Security Alert',
          category: 'transactional',
          title: '🔐 New Login from Chrome on Windows',
          message: 'We noticed a new login to your account. If this wasn\'t you, please secure your account.',
          variables: [],
          icon: 'https://cdn-icons-png.flaticon.com/512/2913/2913133.png'
        }
      ]

      const createdTemplates = await Promise.all(
        templates.map(template => 
          prisma.template.create({
            data: {
              ...template,
              userId: adminUser.id
            }
          })
        )
      )
      results.templates = createdTemplates.length
    } else {
      results.templates = existingTemplates.length
    }

    // 3. Create default landing page if none exist
    const existingLandingPages = await prisma.landingPage.findMany()
    if (existingLandingPages.length === 0) {
      await prisma.landingPage.create({
        data: {
          name: 'Direct Test Page',
          domain: 'localhost:3000',
          landingId: 'direct-test',
          status: 'active',
          botProtection: true,
          enableRedirect: false
        }
      })
      results.landingPages = 1
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      results
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { error: 'Failed to seed database: ' + error.message },
      { status: 500 }
    )
  }
}