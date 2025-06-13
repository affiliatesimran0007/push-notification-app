import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/seed-templates - Seed templates into database
export async function GET(request) {
  try {
    // Check if templates already exist
    const existingTemplates = await prisma.template.findMany()
    if (existingTemplates.length > 0) {
      return NextResponse.json({ 
        message: 'Templates already exist', 
        count: existingTemplates.length 
      })
    }

    // Get admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (!adminUser) {
      // Create admin user if doesn't exist
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin'
        }
      })
      adminUser = newAdmin
    }

    // Templates data
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
      }
    ]

    // Create templates
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

    return NextResponse.json({ 
      success: true, 
      message: 'Templates seeded successfully',
      count: createdTemplates.length 
    })
  } catch (error) {
    console.error('Error seeding templates:', error)
    return NextResponse.json(
      { error: 'Failed to seed templates' },
      { status: 500 }
    )
  }
}