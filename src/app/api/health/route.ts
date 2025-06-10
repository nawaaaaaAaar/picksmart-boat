import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    return NextResponse.json({
      status: 'OK',
      message: 'Picksmart Stores API is running',
      timestamp: new Date().toISOString(),
      database: 'Connected'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'ERROR',
        message: 'Service unavailable',
        timestamp: new Date().toISOString(),
        database: 'Disconnected'
      },
      { status: 503 }
    )
  }
} 