import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAI } from 'assemblyai'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY || process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured. Set ASSEMBLYAI_API_KEY in your environment.' },
        { status: 500 }
      )
    }
    
    console.log('[Token API] Using SDK to create temporary token')
    const client = new AssemblyAI({ apiKey })
    
    const token = await client.streaming.createTemporaryToken({
      expires_in_seconds: 600,
    })
    
    console.log('[Token API] Got token:', token.substring(0, 20) + '...')

    return NextResponse.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('AssemblyAI token error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to generate AssemblyAI token: ${errorMessage}` },
      { status: 500 }
    )
  }
}