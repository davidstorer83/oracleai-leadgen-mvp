import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getYouTubeChannelData } from "@/lib/youtube"
import { createTrainingData, generateSystemPrompt } from "@/lib/openai"

export async function POST(req: Request) {
  try {
    const { coachId } = await req.json()

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 })
    }

    console.log(`🔄 Retraining coach: ${coachId}`)

    // Get coach data
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    console.log(`📊 Coach found: ${coach.name} (${coach.channelName})`)

    // Update coach status to training
    await prisma.coach.update({
      where: { id: coachId },
      data: { status: 'TRAINING' },
    })

    // Fetch fresh YouTube data
    console.log(`📹 Fetching fresh YouTube data for: ${coach.channelUrl}`)
    const youtubeData = await getYouTubeChannelData(coach.channelUrl, 50)
    
    console.log(`📊 Fresh YouTube data:`, {
      channelName: youtubeData.channelInfo.title,
      totalVideos: youtubeData.totalVideosProcessed,
      videosWithTranscripts: youtubeData.videos.length,
      totalTranscripts: youtubeData.totalTranscriptsExtracted
    })

    // Update channel metadata
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

    // Delete existing videos
    console.log(`🗑️ Deleting existing videos for coach: ${coachId}`)
    await prisma.video.deleteMany({
      where: { coachId },
    })

    // Save new videos with transcripts
    console.log(`💾 Saving ${youtubeData.videos.length} videos to database`)
    const processedVideos = []
    
    for (const video of youtubeData.videos) {
      try {
        console.log(`📝 Saving video: ${video.title}`)
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
        console.log(`✅ Saved video: ${video.title} (ID: ${savedVideo.id})`)
      } catch (error) {
        console.error(`❌ Failed to save video: ${video.title}`, error)
      }
    }

    console.log(`📊 Successfully saved ${processedVideos.length} videos`)

    // Update or create YouTube channel lead
    try {
      console.log(`📝 Updating YouTube channel lead...`)
      
      // Check if YouTube channel lead already exists
      const existingLead = await prisma.lead.findFirst({
        where: {
          coachId,
          metadata: {
            contains: '"type":"youtube_channel"'
          }
        }
      })

      const leadData = {
        email: `channel@${youtubeData.channelInfo.customUrl || youtubeData.channelInfo.id}.youtube.com`,
        name: youtubeData.channelInfo.title,
        source: 'youtube_channel',
        status: 'new',
        notes: `YouTube Channel: ${youtubeData.channelInfo.title}`,
        coachId,
        metadata: JSON.stringify({
          type: 'youtube_channel',
          channelUrl: coach.channelUrl,
          channelId: youtubeData.channelInfo.id,
          channelInfo: {
            title: youtubeData.channelInfo.title,
            description: youtubeData.channelInfo.description,
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
            contactInfo: {
              emails: youtubeData.channelInfo.email || [],
              phones: youtubeData.channelInfo.phone || [],
              websites: youtubeData.channelInfo.website || [],
              isBusiness: youtubeData.channelInfo.businessInfo?.isBusiness || false
            },
            socialMedia: youtubeData.channelInfo.socialMedia || {}
          },
          timestamp: new Date().toISOString()
        })
      }

      if (existingLead) {
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: leadData
        })
        console.log(`✅ Updated existing YouTube channel lead`)
      } else {
        await prisma.lead.create({ data: leadData })
        console.log(`✅ Created new YouTube channel lead`)
      }
    } catch (leadError) {
      console.error(`❌ Failed to update YouTube channel lead:`, leadError)
    }

    // Generate training data
    console.log(`🤖 Generating training data...`)
    const trainingData = await createTrainingData(coachId)
    
    if (!trainingData) {
      throw new Error("Failed to generate training data")
    }

    console.log(`📊 Training data generated:`, {
      videosCount: trainingData.videos.length,
      channelName: trainingData.channelInfo.name
    })

    // Generate system prompt
    console.log(`📝 Generating system prompt...`)
    const systemPrompt = await generateSystemPrompt(trainingData)
    
    console.log(`✅ System prompt generated (${systemPrompt.length} characters)`)

    // Update coach with training data
    const trainingDataJson = JSON.stringify({
      ...trainingData,
      systemPrompt,
    })

    await prisma.coach.update({
      where: { id: coachId },
      data: {
        trainingData: trainingDataJson,
        status: 'READY',
      },
    })

    console.log(`🎉 Retraining completed successfully for coach: ${coachId}`)

    return NextResponse.json({
      success: true,
      message: 'Coach retrained successfully',
      data: {
        coachId,
        videosSaved: processedVideos.length,
        trainingDataVideos: trainingData.videos.length,
        systemPromptLength: systemPrompt.length,
        channelInfo: youtubeData.channelInfo,
        statistics: {
          totalVideosProcessed: youtubeData.totalVideosProcessed,
          totalTranscriptsExtracted: youtubeData.totalTranscriptsExtracted,
          totalCharactersInTranscripts: youtubeData.totalCharactersInTranscripts,
          averageVideoLength: youtubeData.averageVideoLength,
          channelAge: youtubeData.channelAge,
        }
      }
    })
  } catch (error) {
    console.error('❌ Retraining failed:', error)
    
    // Update coach status to error
    await prisma.coach.update({
      where: { id: coachId },
      data: { status: 'ERROR' },
    })
    
    return NextResponse.json({ 
      error: 'Retraining failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function parseDurationToSeconds(duration: string): number | null {
  if (!duration) return null
  
  // Handle formats like "1:23" or "1:23:45"
  const parts = duration.split(':').map(Number)
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    // HH:MM:SS format
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
