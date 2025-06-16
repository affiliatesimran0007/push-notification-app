import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/templates
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Build where clause
    const where = category && category !== 'all' 
      ? { category: category.toLowerCase() }
      : {}

    const templates = await prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      templates,
      total: templates.length
    })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Create new template
export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.name || !body.title || !body.message || !body.category) {
      return NextResponse.json(
        { error: 'Name, category, title, and message are required' },
        { status: 400 }
      )
    }

    // Extract variables from title and message
    const variablePattern = /\{\{(\w+)\}\}/g
    const titleVars = [...(body.title.matchAll(variablePattern) || [])].map(m => m[1])
    const messageVars = [...(body.message.matchAll(variablePattern) || [])].map(m => m[1])
    const urlVars = body.url ? [...(body.url.matchAll(variablePattern) || [])].map(m => m[1]) : []
    const allVars = [...new Set([...titleVars, ...messageVars, ...urlVars])]

    // For now, using the admin user since we don't have authentication yet
    // In production, this should come from the authenticated user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@example.com' }
    })
    
    if (!adminUser) {
      // Try to find any user for debugging
      const userCount = await prisma.user.count()
      console.error('Admin user not found. Total users in database:', userCount)
      console.error('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
      
      return NextResponse.json(
        { 
          error: 'Admin user not found. Please run database seed.',
          debug: {
            userCount,
            dbUrl: process.env.DATABASE_URL?.substring(0, 50) + '...'
          }
        },
        { status: 500 }
      )
    }
    
    const userId = adminUser.id

    const newTemplate = await prisma.template.create({
      data: {
        name: body.name,
        category: body.category.toLowerCase(),
        title: body.title,
        message: body.message,
        icon: body.icon || '/icon-192x192.png',
        badge: body.badge || '/badge-72x72.png',
        url: body.url || '/',
        actions: body.actions || [],
        sound: body.sound || 'default',
        variables: allVars,
        requireInteraction: body.requireInteraction || false,
        userId: userId
      }
    })

    return NextResponse.json({
      success: true,
      template: newTemplate
    })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id]
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID required' },
        { status: 400 }
      )
    }

    await prisma.template.delete({
      where: { id: templateId }
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}