import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/create-admin - Create admin user
export async function GET(request) {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin user already exists',
        admin: {
          id: existingAdmin.id,
          name: existingAdmin.name,
          email: existingAdmin.email
        }
      })
    }

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@pushnotify.com',
        role: 'admin'
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created successfully',
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email
      }
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user: ' + error.message },
      { status: 500 }
    )
  }
}