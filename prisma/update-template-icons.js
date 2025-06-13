const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateTemplateIcons() {
  console.log('🔄 Updating template icons...')

  const iconMap = {
    'Welcome Message': 'https://cdn-icons-png.flaticon.com/512/2645/2645890.png',
    'Cart Abandonment': 'https://cdn-icons-png.flaticon.com/512/2838/2838895.png',
    'New Article': 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png',
    'Order Shipped': 'https://cdn-icons-png.flaticon.com/512/2927/2927347.png',
    'Weekly Newsletter': 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png',
  }

  try {
    // Update each template with its icon
    for (const [name, icon] of Object.entries(iconMap)) {
      const result = await prisma.template.updateMany({
        where: { name },
        data: { icon }
      })
      
      if (result.count > 0) {
        console.log(`✅ Updated icon for "${name}"`)
      } else {
        console.log(`⚠️  No template found with name "${name}"`)
      }
    }

    // Also update any templates that might have different names but matching categories
    const categoryIconMap = {
      'engagement': 'https://cdn-icons-png.flaticon.com/512/2645/2645890.png',
      'ecommerce': 'https://cdn-icons-png.flaticon.com/512/2838/2838895.png',
      'content': 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png',
      'transactional': 'https://cdn-icons-png.flaticon.com/512/2927/2927347.png',
    }

    // Update templates without icons based on their category
    for (const [category, icon] of Object.entries(categoryIconMap)) {
      const result = await prisma.template.updateMany({
        where: {
          category,
          icon: null
        },
        data: { icon }
      })
      
      if (result.count > 0) {
        console.log(`✅ Updated ${result.count} ${category} templates without icons`)
      }
    }

    console.log('\n🎉 Template icons updated successfully!')
    
    // Show all templates with their icons
    const templates = await prisma.template.findMany({
      select: {
        name: true,
        category: true,
        icon: true
      }
    })
    
    console.log('\n📋 Current templates:')
    templates.forEach(template => {
      console.log(`   - ${template.name} (${template.category}): ${template.icon ? '✅ Has icon' : '❌ No icon'}`)
    })

  } catch (error) {
    console.error('❌ Error updating template icons:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateTemplateIcons()