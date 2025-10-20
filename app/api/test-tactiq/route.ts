import { NextRequest, NextResponse } from 'next/server'
import { getVideoTranscriptTactiq } from '@/lib/youtube'

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    console.log(`🔍 Testing Tactiq API transcript extraction for: ${videoId}`)
    
    const transcript = await getVideoTranscriptTactiq(videoId)
    
    if (transcript) {
      console.log(`✅ Tactiq API transcript extracted: ${transcript.length} characters`)
      
      return NextResponse.json({
        success: true,
        videoId,
        transcript,
        length: transcript.length,
        preview: transcript.substring(0, 200) + '...',
        method: 'Tactiq API'
      })
    } else {
      return NextResponse.json({
        success: false,
        videoId,
        error: 'No transcript available or extraction failed',
        method: 'Tactiq API'
      })
    }
  } catch (error) {
    console.error('Tactiq API test failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract transcript with Tactiq API', 
        details: error instanceof Error ? error.message : 'Unknown error',
        method: 'Tactiq API'
      }, 
      { status: 500 }
    )
  }
}
