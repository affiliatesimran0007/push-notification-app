import { NextResponse } from 'next/server'

// Temporary in-memory storage
let templates = [
  {
    id: '1',
    name: 'Welcome Message',
    category: 'engagement',
    title: 'Welcome to {{app_name}}! 👋',
    message: 'Thanks for subscribing, {{user_name}}. Stay tuned for updates!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    url: '{{welcome_url}}',
    actions: [],
    sound: 'default',
    variables: ['app_name', 'user_name', 'welcome_url'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Cart Abandonment',
    category: 'ecommerce',
    title: 'You left items in your cart 🛒',
    message: 'Complete your purchase and get {{discount}}% off!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    url: '{{cart_url}}',
    actions: [
      { action: 'view-cart', title: 'View Cart' },
      { action: 'dismiss', title: 'Not Now' }
    ],
    sound: 'default',
    variables: ['discount', 'cart_url'],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
]

// GET /api/templates
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let filteredTemplates = templates
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === category)
    }

    return NextResponse.json({
      templates: filteredTemplates,
      total: filteredTemplates.length
    })
  } catch (error) {
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

    if (!body.name || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Name, title, and message are required' },
        { status: 400 }
      )
    }

    // Extract variables from title and message
    const variablePattern = /\{\{(\w+)\}\}/g
    const titleVars = [...(body.title.matchAll(variablePattern) || [])].map(m => m[1])
    const messageVars = [...(body.message.matchAll(variablePattern) || [])].map(m => m[1])
    const urlVars = body.url ? [...(body.url.matchAll(variablePattern) || [])].map(m => m[1]) : []
    const allVars = [...new Set([...titleVars, ...messageVars, ...urlVars])]

    const newTemplate = {
      id: Date.now().toString(),
      name: body.name,
      category: body.category || 'general',
      title: body.title,
      message: body.message,
      icon: body.icon || '/icon-192x192.png',
      badge: body.badge || '/badge-72x72.png',
      url: body.url || '/',
      actions: body.actions || [],
      sound: body.sound || 'default',
      variables: allVars,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    templates.push(newTemplate)

    return NextResponse.json({
      success: true,
      template: newTemplate
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create template' },
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

    templates = templates.filter(t => t.id !== templateId)

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}