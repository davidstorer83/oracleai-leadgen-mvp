import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getYouTubeChannelData, extractChannelId } from "@/lib/youtube"
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
      return NextResponse.json({ error: 'Name, Email, and channel URL are required' }, { status: 400 })
    }

    // Extract channel ID from URL
    const channelId = extractChannelId(channelUrl)
    if (!channelId) {
      return NextResponse.json({ error: 'Invalid YouTube channel URL' }, { status: 400 })
    }

    // Get channel info
    const channelInfo = await getYouTubeChannelData(channelUrl, 1)

    if (!channelInfo || !channelInfo.channelInfo) {
      return NextResponse.json({ error: 'Could not fetch channel information' }, { status: 400 })
    }

    // Create coach
    const coach = await prisma.coach.create({
      data: {
        name,
        email,
        description,
        channelUrl,
        channelId: channelInfo.channelInfo.id,
        channelName: channelInfo.channelInfo.title,
        avatar: channelInfo.channelInfo.thumbnail,
        tone,
        creativityLevel,
        status: 'PENDING',
        userId: user.id,
        shareableId: crypto.randomUUID(), // Generate unique shareable ID
        isPublic: false, // Default to private
        metadata: JSON.stringify({
          subscriberCount: channelInfo.channelInfo.subscriberCount,
          videoCount: channelInfo.channelInfo.videoCount,
          thumbnail: channelInfo.channelInfo.thumbnail,
          keywords: channelInfo.channelInfo.keywords || [],
          socialLinks: channelInfo.channelInfo.socialLinks || [],
          verified: channelInfo.channelInfo.verified || false,
          isMonetized: channelInfo.channelInfo.isMonetized || false,
          location: channelInfo.channelInfo.location || '',
          joinedDate: channelInfo.channelInfo.joinedDate || '',
          totalViews: channelInfo.channelInfo.totalViews || 0,
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
              subscriberCount: channelInfo.channelInfo.subscriberCount,
              videoCount: channelInfo.channelInfo.videoCount,
              description: channelInfo.channelInfo.description
            },
            timestamp: new Date().toISOString()
          })
        }
      })

      // Create lead for YouTube channel contact information
      await prisma.lead.create({
        data: {
          email: `channel@${channelInfo.channelInfo.customUrl || channelInfo.channelInfo.id}.youtube.com`, // Placeholder email
          name: channelInfo.channelInfo.title,
          source: 'youtube_channel',
          status: 'new',
          notes: `YouTube Channel: ${channelInfo.channelInfo.title}`,
          coachId: coach.id,
          metadata: JSON.stringify({
            type: 'youtube_channel',
            channelUrl: channelUrl,
            channelId: channelInfo.channelInfo.id,
            channelInfo: {
              title: channelInfo.channelInfo.title,
              description: channelInfo.channelInfo.description,
              subscriberCount: channelInfo.channelInfo.subscriberCount,
              videoCount: channelInfo.channelInfo.videoCount,
              totalViews: channelInfo.channelInfo.totalViews,
              thumbnail: channelInfo.channelInfo.thumbnail,
              keywords: channelInfo.channelInfo.keywords,
              socialLinks: channelInfo.channelInfo.socialLinks,
              verified: channelInfo.channelInfo.verified,
              isMonetized: channelInfo.channelInfo.isMonetized,
              location: channelInfo.channelInfo.location,
              joinedDate: channelInfo.channelInfo.joinedDate,
              customUrl: channelInfo.channelInfo.customUrl,
              country: channelInfo.channelInfo.country,
            // Contact information extracted from description
            contactInfo: {
              emails: channelInfo.channelInfo.email || [],
              phones: channelInfo.channelInfo.phone || [],
              websites: channelInfo.channelInfo.website || [],
              isBusiness: channelInfo.channelInfo.businessInfo?.isBusiness || false
            },
            // Social media links
            socialMedia: channelInfo.channelInfo.socialMedia || {}
            },
            timestamp: new Date().toISOString()
          })
        }
      })
    } catch (leadError) {
      // Don't fail coach creation if lead creation fails
    }

    // Start training process in background (non-blocking)
    setImmediate(() => {
      startTrainingProcess(coach.id).catch(error => {
      })
    })

    return NextResponse.json({ ok: true, coach })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create coach' }, { status: 500 })
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

export async function startTrainingProcess(coachId: string) {
  try {
    // Create training job
    const trainingJob = await prisma.trainingJob.create({
      data: {
        coachId,
        status: 'PENDING',
      },
    })

    // Update coach status
    await prisma.coach.update({
      where: { id: coachId },
      data: { status: 'TRAINING' },
    })

    // Get coach data
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
    })

    if (!coach) return

    // Update job status
    await prisma.trainingJob.update({
      where: { id: trainingJob.id },
      data: { status: 'RUNNING', startedAt: new Date(), progress: 10 },
    })

    // Fetch comprehensive YouTube channel data
    const youtubeData = await Promise.race([
      getYouTubeChannelData(coach.channelUrl, 50), // Increased to 50 videos for maximum comprehensive knowledge
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('YouTube data fetching timeout')), 240000) // 4 minute timeout for 50 videos
      )
    ])
    
    
    await prisma.trainingJob.update({
      where: { id: trainingJob.id },
      data: { progress: 30 },
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

    // Generate training data and system prompt
    const trainingData = await Promise.race([
      createTrainingData(coachId),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Training data generation timeout')), 120000) // 2 minute timeout for 50 videos
      )
    ])
    
    if (!trainingData) {
      throw new Error("Failed to generate training data. Ensure OpenAI API is configured and working.")
    }
    
    
    // Generate system prompt instantly (no API calls)
    
    const systemPrompt = await Promise.race([
      generateSystemPrompt(trainingData),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('System prompt generation timeout')), 30000) // 30 second timeout
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