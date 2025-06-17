import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// GET /api/icons - List available icons
export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    
    // List of icon files in public directory
    const iconFiles = []
    
    // Check root public directory
    const files = fs.readdirSync(publicDir)
    files.forEach(file => {
      if (file.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
        iconFiles.push({
          name: file,
          url: `/${file}`,
          path: 'root'
        })
      }
    })
    
    // Check icons subdirectory if it exists
    const iconsDir = path.join(publicDir, 'icons')
    if (fs.existsSync(iconsDir)) {
      const iconDirFiles = fs.readdirSync(iconsDir)
      iconDirFiles.forEach(file => {
        if (file.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
          iconFiles.push({
            name: file,
            url: `/icons/${file}`,
            path: 'icons'
          })
        }
      })
    }
    
    // Add some default icon options
    const defaultIcons = [
      { name: 'Default Icon', url: '/icon-192x192.png', isDefault: true },
      { name: 'Badge Icon', url: '/badge-72x72.png', isDefault: true },
      // Popular emoji alternatives (as text that will be converted to default icon)
      { name: 'Shopping Cart', emoji: '🛒', isEmoji: true },
      { name: 'Sale/Discount', emoji: '💰', isEmoji: true },
      { name: 'Gift', emoji: '🎁', isEmoji: true },
      { name: 'Bell', emoji: '🔔', isEmoji: true },
      { name: 'Star', emoji: '⭐', isEmoji: true },
      { name: 'Fire', emoji: '🔥', isEmoji: true },
      { name: 'Heart', emoji: '❤️', isEmoji: true },
      { name: 'Megaphone', emoji: '📣', isEmoji: true },
    ]
    
    return NextResponse.json({
      success: true,
      icons: iconFiles,
      defaultIcons: defaultIcons,
      total: iconFiles.length + defaultIcons.length
    })
  } catch (error) {
    console.error('Failed to list icons:', error)
    return NextResponse.json(
      { error: 'Failed to list icons', details: error.message },
      { status: 500 }
    )
  }
}