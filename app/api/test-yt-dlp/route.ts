import { NextRequest, NextResponse } from 'next/server'
import { getVideoTranscriptYtDlp } from '@/lib/youtube'

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    const transcript = await getVideoTranscriptYtDlp(videoId)
    
    if (transcript) {
      
      return NextResponse.json({
        success: true,
        videoId,
        transcript,
        length: transcript.length,
        preview: transcript.substring(0, 200) + '...'
      })
    } else {
      return NextResponse.json({
        success: false,
        videoId,
        error: 'No transcript available or extraction failed'
      })
    }
  } catch (error) {
    console.error('yt-dlp test failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to extract transcript with yt-dlp', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}
