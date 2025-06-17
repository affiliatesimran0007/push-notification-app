import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPEG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 1MB)
    const maxSize = 1 * 1024 * 1024 // 1MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 1MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create hash of file content for unique naming
    const hash = crypto.createHash('md5').update(buffer).digest('hex')
    const ext = path.extname(file.name)
    const filename = `icon-${hash.substring(0, 8)}${ext}`
    
    // Save to public/icons directory
    const iconsDir = path.join(process.cwd(), 'public', 'icons')
    const filepath = path.join(iconsDir, filename)
    
    // Create icons directory if it doesn't exist
    const { mkdir } = await import('fs/promises')
    await mkdir(iconsDir, { recursive: true })
    
    // Write file
    await writeFile(filepath, buffer)
    
    // Return the URL path
    const iconUrl = `/icons/${filename}`
    
    return NextResponse.json({
      success: true,
      url: iconUrl,
      filename: filename,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error('Icon upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload icon', details: error.message },
      { status: 500 }
    )
  }
}