import { NextRequest, NextResponse } from 'next/server'
import { getYouTubeChannelData } from '@/lib/youtube'

export async function POST(request: NextRequest) {
  try {
    const { channelUrl, maxVideos = 5 } = await request.json()

    if (!channelUrl) {
      return NextResponse.json({ error: 'Channel URL is required' }, { status: 400 })
    }

    
    const youtubeData = await getYouTubeChannelData(channelUrl, maxVideos)

    return NextResponse.json({
      success: true,
      data: youtubeData,
      summary: {
        channelName: youtubeData.channelInfo.title,
        totalVideos: youtubeData.totalVideosProcessed,
        transcriptsExtracted: youtubeData.totalTranscriptsExtracted,
        totalCharacters: youtubeData.totalCharactersInTranscripts,
        extractedLinks: {
          emails: youtubeData.channelInfo.email?.length || 0,
          phones: youtubeData.channelInfo.phone?.length || 0,
          websites: youtubeData.channelInfo.website?.length || 0,
          socialMedia: Object.keys(youtubeData.channelInfo.socialMedia || {}).length
        }
      }
    })
  } catch (error) {
    console.error('Enhanced YouTube API test failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch enhanced YouTube data', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    )
  }
}
