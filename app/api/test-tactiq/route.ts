import { NextRequest, NextResponse } from 'next/server'
import { getVideoTranscriptTactiq } from '@/lib/youtube'

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    const transcript = await getVideoTranscriptTactiq(videoId)
    
    if (transcript) {
      
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
