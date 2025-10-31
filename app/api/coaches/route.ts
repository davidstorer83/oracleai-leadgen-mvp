import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getYouTubeChannelData, extractChannelId, getChannelInfo } from "@/lib/youtube"
import { createTrainingData, generateSystemPrompt } from "@/lib/openai"
import { verifyToken } from "@/lib/auth"

// Verify prisma client is available
if (!prisma) {
  throw new Error('Prisma client not available - check database connection and environment variables')
}

function parseDurationToSeconds(duration: string): number | null {
  if (!duration) return null
  
  // Handle formats like "5:22", "1:30:45", "45"
  const parts = duration.split(':').map(part => parseInt(part, 10))
  
  if (parts.length === 1) {
    // Just seconds: "45"
    return parts[0]
  } else if (parts.length === 2) {
    // Minutes:seconds: "5:22"
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    // Hours:minutes:seconds: "1:30:45"
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  
  return null
}

// Extract contact information from channel description
function extractContactInfo(description: string): any {
  if (!description) return {}
  
  const contactInfo: any = {}
  
  // Extract email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emails = description.match(emailRegex)
  if (emails) {
    contactInfo.emails = [...new Set(emails)] // Remove duplicates
  }
  
  // Extract phone numbers
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
  const phones = description.match(phoneRegex)
  if (phones) {
    contactInfo.phones = [...new Set(phones)]
  }
  
  // Extract website URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const urls = description.match(urlRegex)
  if (urls) {
    contactInfo.websites = [...new Set(urls)]
  }
  
  // Extract business information
  if (description.toLowerCase().includes('business') || description.toLowerCase().includes('company')) {
    contactInfo.isBusiness = true
  }
  
  return contactInfo
}

// Extract social media links from description and social links
function extractSocialMediaLinks(description: string, socialLinks: string[] = []): any {
  const socialMedia: any = {}
  
  // Combine description and social links for analysis
  const combinedText = `${description} ${socialLinks.join(' ')}`
  
  // Extract social media platforms
  const platforms = {
    instagram: /instagram\.com\/([a-zA-Z0-9._]+)/gi,
    twitter: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9._]+)/gi,
    facebook: /facebook\.com\/([a-zA-Z0-9._]+)/gi,
    linkedin: /linkedin\.com\/(?:in\/|company\/)([a-zA-Z0-9._-]+)/gi,
    tiktok: /tiktok\.com\/@([a-zA-Z0-9._]+)/gi,
    youtube: /youtube\.com\/(?:c\/|channel\/|@)([a-zA-Z0-9._-]+)/gi,
    discord: /discord\.(?:gg|com)\/([a-zA-Z0-9._-]+)/gi,
    telegram: /t\.me\/([a-zA-Z0-9._]+)/gi,
    snapchat: /snapchat\.com\/add\/([a-zA-Z0-9._]+)/gi,
    twitch: /twitch\.tv\/([a-zA-Z0-9._]+)/gi
  }
  
  for (const [platform, regex] of Object.entries(platforms)) {
    const matches = combinedText.match(regex)
    if (matches) {
      socialMedia[platform] = [...new Set(matches)]
    }
  }
  
  return socialMedia
}

async function getCurrentUser(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  // Verify user exists in database
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true }
  })

  return user
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coaches = await prisma.coach.findMany({
      where: { userId: user.id },
      include: {
        videos: true,
        trainingJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ coaches })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coaches' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const { name, email, channelUrl, description, tone, creativityLevel } = body
    if (!name || !email || !channelUrl) {
      return NextResponse.json({ error: 'Name, Email, and Channel ID are required' }, { status: 400 })
    }

    // Check if YouTube API key is available
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'YouTube API key is not configured' }, { status: 500 })
    }

    // Get channel information first (without videos for speed)
    const channelInfoOnly = await getChannelInfo(channelUrl)

    if (!channelInfoOnly) {
      return NextResponse.json({ error: 'Could not fetch channel information' }, { status: 400 })
    }

    // Determine max videos: if channel has more than 50, analyze latest 50; otherwise analyze all
    const videoCount = channelInfoOnly.videoCount || 0
    const maxVideosToAnalyze = videoCount > 50 ? 50 : Math.max(videoCount, 10) // At least 10 for training

    const coach = await prisma.coach.create({
      data: {
        name,
        email,
        description,
        channelUrl,
        channelId: channelInfoOnly.id,
        channelName: channelInfoOnly.title,
        avatar: channelInfoOnly.thumbnail,
        tone,
        creativityLevel,
        status: 'TRAINING', // Start as TRAINING immediately
        userId: user.id,
        shareableId: crypto.randomUUID(), // Generate unique shareable ID
        isPublic: false, // Default to private
        metadata: JSON.stringify({
          subscriberCount: channelInfoOnly.subscriberCount,
          videoCount: channelInfoOnly.videoCount,
          thumbnail: channelInfoOnly.thumbnail,
          keywords: channelInfoOnly.keywords || [],
          socialLinks: channelInfoOnly.socialLinks || [],
          verified: channelInfoOnly.verified || false,
          isMonetized: channelInfoOnly.isMonetized || false,
          location: channelInfoOnly.location || '',
          joinedDate: channelInfoOnly.joinedDate || '',
          totalViews: channelInfoOnly.totalViews || 0,
          scrapedAt: new Date().toISOString()
        })
      },
    })

    // Create initial lead for the coach creator
    try {
      // Verify prisma client is properly initialized
      if (!prisma || !prisma.lead) {
        throw new Error('Database client not properly initialized')
      }

      // Create lead for coach creator
      await prisma.lead.create({
        data: {
          email: user.email,
          name: user.name,
          source: 'coach_creation',
          status: 'converted',
          notes: `Coach creator for ${coach.name || coach.channelName}`,
          coachId: coach.id,
          metadata: JSON.stringify({
            type: 'coach_creator',
            channelUrl: channelUrl,
            channelInfo: {
              subscriberCount: channelInfoOnly.subscriberCount,
              videoCount: channelInfoOnly.videoCount,
              description: channelInfoOnly.description
            },
            timestamp: new Date().toISOString()
          })
        }
      })

      // Create lead for YouTube channel contact information
      await prisma.lead.create({
        data: {
          email: `channel@${channelInfoOnly.customUrl || channelInfoOnly.id}.youtube.com`, // Placeholder email
          name: channelInfoOnly.title,
          source: 'youtube_channel',
          status: 'new',
          notes: `YouTube Channel: ${channelInfoOnly.title}`,
          coachId: coach.id,
          metadata: JSON.stringify({
            type: 'youtube_channel',
            channelUrl: channelUrl,
            channelId: channelInfoOnly.id,
            channelInfo: {
              title: channelInfoOnly.title,
              description: channelInfoOnly.description,
              subscriberCount: channelInfoOnly.subscriberCount,
              videoCount: channelInfoOnly.videoCount,
              totalViews: channelInfoOnly.totalViews,
              thumbnail: channelInfoOnly.thumbnail,
              keywords: channelInfoOnly.keywords,
              socialLinks: channelInfoOnly.socialLinks,
              verified: channelInfoOnly.verified,
              isMonetized: channelInfoOnly.isMonetized,
              location: channelInfoOnly.location,
              joinedDate: channelInfoOnly.joinedDate,
              customUrl: channelInfoOnly.customUrl,
              country: channelInfoOnly.country,
            // Contact information extracted from description
            contactInfo: {
              emails: channelInfoOnly.email || [],
              phones: channelInfoOnly.phone || [],
              websites: channelInfoOnly.website || [],
              isBusiness: channelInfoOnly.businessInfo?.isBusiness || false
            },
            // Social media links
            socialMedia: channelInfoOnly.socialMedia || {}
            },
            timestamp: new Date().toISOString()
          })
        }
      })
    } catch (leadError) {
      // Don't fail coach creation if lead creation fails
    }

    // Start training process immediately with proper video count
    startTrainingProcess(coach.id, maxVideosToAnalyze).catch(() => {
      // Training process failed silently in background
    })

    return NextResponse.json({ ok: true, coach })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to create coach', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { coachIds } = body

    if (!coachIds || !Array.isArray(coachIds) || coachIds.length === 0) {
      return NextResponse.json({ error: 'Coach IDs are required' }, { status: 400 })
    }

    // Verify all coaches belong to the user
    const coaches = await prisma.coach.findMany({
      where: { 
        id: { in: coachIds },
        userId: user.id 
      }
    })

    if (coaches.length !== coachIds.length) {
      return NextResponse.json({ error: 'Some coaches not found or not owned by user' }, { status: 404 })
    }

    // Delete coaches (cascade will handle related data)
    await prisma.coach.deleteMany({
      where: { 
        id: { in: coachIds },
        userId: user.id 
      }
    })

    return NextResponse.json({ 
      message: `Successfully deleted ${coachIds.length} coach${coachIds.length > 1 ? 'es' : ''}`,
      deletedCount: coachIds.length 
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coaches' }, { status: 500 })
  }
}

export async function startTrainingProcess(coachId: string, maxVideos?: number) {
  try {
    // Get coach data first to get video count from metadata
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
    })

    if (!coach) return

    // Parse metadata to get video count
    let videoCount = maxVideos || 50
    try {
      const metadata = JSON.parse(coach.metadata || '{}')
      const channelVideoCount = metadata.videoCount || 0
      // If channel has more than 50 videos, analyze latest 50; otherwise analyze all (but cap at 50)
      if (channelVideoCount > 0) {
        videoCount = channelVideoCount > 50 ? 50 : channelVideoCount
      }
    } catch (e) {
      // Use default if metadata parsing fails
    }

    // Create training job with initial status showing we're analyzing videos
    const trainingJob = await prisma.trainingJob.create({
      data: {
        coachId,
        status: 'RUNNING',
        startedAt: new Date(),
        progress: 5,
        videosProcessed: 0,
        videosTotal: videoCount,
      },
    })

    // Update coach status if not already TRAINING
    if (coach.status !== 'TRAINING') {
      await prisma.coach.update({
        where: { id: coachId },
        data: { status: 'TRAINING' },
      })
    }

    // Fetch comprehensive YouTube channel data with progress updates
    // Progress callback updates incrementally as each video is analyzed
    const youtubeData = await Promise.race([
      getYouTubeChannelData(
        coach.channelUrl,
        videoCount,
        async (processed, total) => {
          try {
            // Update progress incrementally: 5% base + 55% for video analysis (60% total)
            const analysisProgress = total > 0 ? Math.round((processed / total) * 55) : 0
            const progress = Math.min(60, Math.max(5, 5 + analysisProgress))
            
            await prisma.trainingJob.update({
              where: { id: trainingJob.id },
              data: {
                videosProcessed: processed,
                videosTotal: total,
                progress,
                status: 'RUNNING'
              }
            })
          } catch (e) {
            // ignore progress update errors
          }
        }
      ),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('YouTube data fetching timeout')), 900000) // 15 minute timeout
      )
    ])

    
    // Update progress after video analysis complete (move to 65%)
    await prisma.trainingJob.update({
      where: { id: trainingJob.id },
      data: { 
        progress: 65, 
        videosTotal: youtubeData.videos.length,
        videosProcessed: youtubeData.videos.length,
      },
    })

    // Save channel metadata
    const channelMetadata = {
      subscriberCount: youtubeData.channelInfo.subscriberCount,
      videoCount: youtubeData.channelInfo.videoCount,
      totalViews: youtubeData.channelInfo.totalViews,
      thumbnail: youtubeData.channelInfo.thumbnail,
      keywords: youtubeData.channelInfo.keywords,
      socialLinks: youtubeData.channelInfo.socialLinks,
      verified: youtubeData.channelInfo.verified,
      isMonetized: youtubeData.channelInfo.isMonetized,
      location: youtubeData.channelInfo.location,
      joinedDate: youtubeData.channelInfo.joinedDate,
      customUrl: youtubeData.channelInfo.customUrl,
      country: youtubeData.channelInfo.country,
    }


    await prisma.coach.update({
      where: { id: coachId },
      data: {
        channelName: youtubeData.channelInfo.title,
        description: youtubeData.channelInfo.description,
        metadata: JSON.stringify(channelMetadata),
      },
    })

    // Save videos with transcripts
    const processedVideos = []
    
    for (const video of youtubeData.videos) {
      try {
          const savedVideo = await prisma.video.create({
            data: {
              title: video.title,
              description: video.description,
              videoId: video.id,
              url: video.url,
              thumbnail: video.thumbnail,
              duration: parseDurationToSeconds(video.duration),
            publishedAt: new Date(video.publishedAt),
            transcript: (video as any).transcript || '',
              coachId,
            },
          })
          processedVideos.push(savedVideo)
      } catch (error) {
        // Continue with other videos even if one fails
      }
    }
    

    await prisma.trainingJob.update({
      where: { id: trainingJob.id },
      data: { progress: 70 },
    })

    // Note: Progress updates happen incrementally during video analysis above

    // Generate training data and system prompt (faster timeouts for professional experience)
    await prisma.trainingJob.update({
      where: { id: trainingJob.id },
      data: { progress: 75 },
    })
    
    const trainingData = await Promise.race([
      createTrainingData(coachId),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Training data generation timeout')), 240000) // 4 minute timeout
      )
    ])
    
    if (!trainingData) {
      throw new Error("Failed to generate training data. Ensure OpenAI API is configured and working.")
    }
    
    await prisma.trainingJob.update({
      where: { id: trainingJob.id },
      data: { progress: 85 },
    })
    
    const systemPrompt = await Promise.race([
      generateSystemPrompt(trainingData),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('System prompt generation timeout')), 90000) // 1.5 minute timeout
      )
    ])
    
    
    const trainingDataJson = JSON.stringify({
      ...trainingData,
      systemPrompt,
    })

    // Also store system prompt in metadata for public API access
    const metadataJson = JSON.stringify({
      systemPrompt,
      channelInfo: trainingData.channelInfo,
      totalVideos: trainingData.videos.length,
      generatedAt: new Date().toISOString()
    })

    await prisma.coach.update({
      where: { id: coachId },
      data: {
        trainingData: trainingDataJson,
        metadata: metadataJson,
        status: 'READY',
      },
    })

    await prisma.trainingJob.update({
      where: { id: trainingJob.id },
      data: {
        status: 'COMPLETED',
        progress: 100,
        videosProcessed: youtubeData.videos.length,
        videosTotal: youtubeData.videos.length,
        completedAt: new Date(),
      },
    })
    
    // Return comprehensive data summary
    return {
      success: true,
      dataSummary: {
        channelInfo: youtubeData.channelInfo,
        totalVideosProcessed: youtubeData.totalVideosProcessed,
        totalTranscriptsExtracted: youtubeData.totalTranscriptsExtracted,
        totalCharactersInTranscripts: youtubeData.totalCharactersInTranscripts,
        averageVideoLength: youtubeData.averageVideoLength,
        channelAge: youtubeData.channelAge,
        videosWithTranscripts: youtubeData.videos.length,
      }
    }
  } catch (error) {
    await prisma.coach.update({
      where: { id: coachId },
      data: { status: 'ERROR' },
    })

    await prisma.trainingJob.updateMany({
      where: { coachId },
      data: {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    
    throw error
  }
}