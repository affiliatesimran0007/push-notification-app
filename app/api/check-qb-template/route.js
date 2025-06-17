import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/check-qb-template - Check QB template data
export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  try {
    // Find QB related templates
    const qbTemplates = await prisma.template.findMany({
      where: {
        OR: [
          { name: { contains: 'QB' } },
          { title: { contains: 'QuickBooks' } },
          { message: { contains: 'QuickBooks' } }
        ]
      }
    })

    // Find recent custom templates
    const customTemplates = await prisma.template.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5
    })

    // Analyze templates
    const templateAnalysis = [...qbTemplates, ...customTemplates].map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      title: template.title,
      message: template.message,
      icon: template.icon,
      iconType: template.icon ? (
        template.icon.startsWith('http') ? 'URL' :
        template.icon.startsWith('data:') ? 'Base64' :
        template.icon.startsWith('/') ? 'Relative Path' :
        template.icon.length <= 4 ? 'Emoji' :
        'Unknown'
      ) : 'None',
      badge: template.badge,
      url: template.url,
      hasActions: !!template.actions && (Array.isArray(template.actions) ? template.actions.length > 0 : true),
      actions: template.actions,
      sound: template.sound,
      requireInteraction: template.requireInteraction,
      userId: template.userId,
      updatedAt: template.updatedAt
    }))

    // Check for potential issues
    const issues = {}
    templateAnalysis.forEach(template => {
      const templateIssues = []
      
      if (!template.icon) {
        templateIssues.push('No icon specified')
      } else if (template.iconType === 'Emoji') {
        templateIssues.push('Emoji icon (will be converted)')
      }
      
      if (!template.badge) {
        templateIssues.push('No badge specified')
      }
      
      if (!template.url) {
        templateIssues.push('No URL specified')
      }
      
      if (!template.userId) {
        templateIssues.push('No userId')
      }
      
      if (templateIssues.length > 0) {
        issues[template.name] = templateIssues
      }
    })

    return NextResponse.json({
      qbTemplates: qbTemplates.length,
      customTemplates: customTemplates.length,
      templates: templateAnalysis,
      issues
    }, { headers })
  } catch (error) {
    console.error('Template check error:', error)
    return NextResponse.json({
      error: 'Failed to check templates',
      details: error.message
    }, { status: 500, headers })
  }
}

// OPTIONS handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}