import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET() {
  try {
    // Check if columns exist by trying to query them
    const testQuery = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Campaign' 
      AND column_name IN ('dismissedCount', 'pendingCount')
    `
    
    const existingColumns = testQuery.map(row => row.column_name)
    const missingColumns = []
    
    if (!existingColumns.includes('dismissedCount')) {
      missingColumns.push('dismissedCount')
    }
    if (!existingColumns.includes('pendingCount')) {
      missingColumns.push('pendingCount')
    }
    
    if (missingColumns.length > 0) {
      // Add missing columns
      for (const column of missingColumns) {
        await prisma.$executeRaw`
          ALTER TABLE "Campaign" 
          ADD COLUMN IF NOT EXISTS "${column}" INTEGER DEFAULT 0
        `
      }
      
      return NextResponse.json({
        success: true,
        message: `Added missing columns: ${missingColumns.join(', ')}`
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'All columns already exist',
      existingColumns
    })
  } catch (error) {
    console.error('Database fix error:', error)
    return NextResponse.json({
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}