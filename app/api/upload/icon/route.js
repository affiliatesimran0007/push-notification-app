import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request) {
  try {
    console.log('Icon upload request received')
    const formData = await request.formData()
    const file = formData.get('file')
    
    console.log('File:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'No file')
    
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

    // Convert file to base64 for storage (since Vercel filesystem is read-only)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`
    
    // For now, return the base64 URL
    // In production, you should upload to a cloud storage service like:
    // - Cloudinary
    // - AWS S3
    // - Vercel Blob Storage
    // - Supabase Storage
    
    console.log('File converted to base64, length:', base64.length)
    
    // Generate a unique filename for reference
    const hash = crypto.createHash('md5').update(buffer).digest('hex')
    const ext = file.name.split('.').pop()
    const filename = `icon-${hash.substring(0, 8)}.${ext}`
    
    return NextResponse.json({
      success: true,
      url: dataUrl, // This will be handled by our webPushService
      filename: filename,
      size: file.size,
      type: file.type,
      isBase64: true,
      message: 'File uploaded as base64. For production, use cloud storage.'
    })
  } catch (error) {
    console.error('Icon upload error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to upload icon', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}