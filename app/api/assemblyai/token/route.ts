import { NextRequest, NextResponse } from 'next/server'
import { AssemblyAI } from 'assemblyai'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      )
    }

    const client = new AssemblyAI({ apiKey })
    
    const token = await client.streaming.createTemporaryToken({
      expires_in_seconds: 3600,
    })

    return NextResponse.json({
      success: true,
      token,
    })
  } catch (error) {
    console.error('AssemblyAI token error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AssemblyAI token' },
      { status: 500 }
    )
  }
}