import { NextResponse } from "next/server"
import { getYouTubeChannelData } from "@/lib/youtube"

export async function POST(req: Request) {
  try {
    const { channelUrl } = await req.json()

    if (!channelUrl) {
      return NextResponse.json({ error: 'Channel URL is required' }, { status: 400 })
    }

    // Test the YouTube API integration
    const youtubeData = await getYouTubeChannelData(channelUrl, 50)

    // Return comprehensive data summary
    return NextResponse.json({
      success: true,
      message: 'YouTube channel data fetched successfully',
      data: {
        channelInfo: {
          name: youtubeData.channelInfo.title,
          description: youtubeData.channelInfo.description,
          subscriberCount: youtubeData.channelInfo.subscriberCount,
          videoCount: youtubeData.channelInfo.videoCount,
          totalViews: youtubeData.channelInfo.totalViews,
          joinedDate: youtubeData.channelInfo.joinedDate,
          location: youtubeData.channelInfo.location,
          verified: youtubeData.channelInfo.verified,
          isMonetized: youtubeData.channelInfo.isMonetized,
          keywords: youtubeData.channelInfo.keywords,
          socialLinks: youtubeData.channelInfo.socialLinks,
          customUrl: youtubeData.channelInfo.customUrl,
          country: youtubeData.channelInfo.country,
        },
        statistics: {
          totalVideosProcessed: youtubeData.totalVideosProcessed,
          totalTranscriptsExtracted: youtubeData.totalTranscriptsExtracted,
          totalCharactersInTranscripts: youtubeData.totalCharactersInTranscripts,
          averageVideoLength: youtubeData.averageVideoLength,
          channelAge: youtubeData.channelAge,
          videosWithTranscripts: youtubeData.videos.length,
        },
        videos: youtubeData.videos.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description?.substring(0, 200) + '...',
          duration: video.duration,
          publishedAt: video.publishedAt,
          viewCount: video.viewCount,
          url: video.url,
          hasTranscript: !!video.transcript,
          transcriptLength: video.transcript?.length || 0,
          tags: video.tags,
        })),
        summary: {
          channelName: youtubeData.channelInfo.title,
          totalVideos: youtubeData.totalVideosProcessed,
          videosWithTranscripts: youtubeData.totalTranscriptsExtracted,
          totalTranscriptCharacters: youtubeData.totalCharactersInTranscripts,
          averageVideoLength: youtubeData.averageVideoLength,
          channelAge: youtubeData.channelAge,
          subscriberCount: youtubeData.channelInfo.subscriberCount.toLocaleString(),
          totalViews: youtubeData.channelInfo.totalViews.toLocaleString(),
          isVerified: youtubeData.channelInfo.verified ? 'Yes' : 'No',
          isMonetized: youtubeData.channelInfo.isMonetized ? 'Yes' : 'No',
          location: youtubeData.channelInfo.location || 'Not specified',
          keywords: youtubeData.channelInfo.keywords?.slice(0, 10) || [],
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch YouTube channel data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
