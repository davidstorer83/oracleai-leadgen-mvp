import OpenAI from 'openai'
import { prisma } from './prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface TrainingData {
  videos: Array<{
    title: string
    transcript: string
    summary: string
    description?: string
    duration?: string
    viewCount?: string
    publishedAt?: string
    thumbnail?: string
  }>
  channelInfo: {
    name: string
    description: string
    subscriberCount?: number
    videoCount?: number
    thumbnail?: string
    keywords?: string[]
    socialLinks?: string[]
    verified?: boolean
    isMonetized?: boolean
    location?: string
    joinedDate?: string
  }
  tone?: string
}

export async function generateVideoSummary(transcript: string, title: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at summarizing YouTube video content. Create a concise summary that captures the main points and key insights from the video transcript.',
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nTranscript: ${transcript}\n\nPlease provide a comprehensive summary of this video content.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error) {
    return ''
  }
}

export async function createTrainingData(coachId: string): Promise<TrainingData | null> {
  try {
    console.log(`🔍 Creating training data for coach: ${coachId}`)
    
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      include: {
        videos: true,
      },
    })

    if (!coach) {
      console.log(`❌ Coach not found: ${coachId}`)
      return null
    }
    
    console.log(`📊 Coach data:`, {
      name: coach.name,
      channelName: coach.channelName,
      videosCount: coach.videos.length,
      status: coach.status
    })

    console.log(`🎬 Processing ${coach.videos.length} videos for training data`)
    const videos = []
    for (const video of coach.videos) {
      if (video.transcript) {
        console.log(`📝 Processing video: ${video.title} (${video.transcript.length} characters)`)
        const summary = await generateVideoSummary(video.transcript, video.title)
        videos.push({
          title: video.title,
          transcript: video.transcript,
          summary,
          description: video.description || '',
          duration: video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '',
          viewCount: '0 views', // We don't store view count in our schema yet
          publishedAt: video.publishedAt ? video.publishedAt.toISOString() : '',
          thumbnail: video.thumbnail || '',
        })
        console.log(`✅ Processed video: ${video.title}`)
      } else {
        console.log(`❌ No transcript for video: ${video.title}`)
      }
    }
    
    console.log(`📊 Training data videos: ${videos.length} videos with transcripts`)

    // Parse channel metadata if available
    let channelMetadata: any = {}
    try {
      if (coach.metadata) {
        channelMetadata = JSON.parse(coach.metadata)
      }
    } catch (e) {
      // No channel metadata available
    }

    return {
      videos,
      channelInfo: {
        name: coach.channelName || coach.name,
        description: coach.description || '',
        subscriberCount: channelMetadata.subscriberCount || 0,
        videoCount: channelMetadata.videoCount || 0,
        thumbnail: channelMetadata.thumbnail || '',
        keywords: channelMetadata.keywords || [],
        socialLinks: channelMetadata.socialLinks || [],
        verified: channelMetadata.verified || false,
        isMonetized: channelMetadata.isMonetized || false,
        location: channelMetadata.location || '',
        joinedDate: channelMetadata.joinedDate || '',
      },
        tone: coach.tone || undefined,
    }
  } catch (error) {
    return null
  }
}

export async function generateSystemPrompt(trainingData: TrainingData): Promise<string> {
  try {
    console.log(`📝 Generating system prompt with ${trainingData.videos.length} videos`)
    
    const videoSummaries = trainingData.videos
      .map(v => `Title: ${v.title}\nSummary: ${v.summary}${v.description ? `\nDescription: ${v.description}` : ''}${v.duration ? `\nDuration: ${v.duration}` : ''}${v.viewCount ? `\nViews: ${v.viewCount}` : ''}`)
      .join('\n\n')
    
    console.log(`📊 Video summaries length: ${videoSummaries.length} characters`)

    const channelInfo = trainingData.channelInfo
    const channelDetails = [
      `Channel Name: ${channelInfo.name}`,
      `Description: ${channelInfo.description}`,
      channelInfo.subscriberCount ? `Subscribers: ${channelInfo.subscriberCount.toLocaleString()}` : '',
      channelInfo.videoCount ? `Total Videos: ${channelInfo.videoCount}` : '',
      channelInfo.verified ? 'Verified Channel: Yes' : '',
      channelInfo.isMonetized ? 'Monetized: Yes' : '',
      channelInfo.location ? `Location: ${channelInfo.location}` : '',
      channelInfo.joinedDate ? `Joined: ${channelInfo.joinedDate}` : '',
      channelInfo.keywords && channelInfo.keywords.length > 0 ? `Keywords: ${channelInfo.keywords.slice(0, 10).join(', ')}` : '',
      channelInfo.socialLinks && channelInfo.socialLinks.length > 0 ? `Social Links: ${channelInfo.socialLinks.slice(0, 3).join(', ')}` : ''
    ].filter(Boolean).join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating AI assistant system prompts. Create a comprehensive system prompt that will help an AI assistant embody the knowledge, style, and personality of a YouTube creator. The prompt should ensure the AI responds in first person as if they ARE the creator, not talking about the creator. Include all available channel information to create a rich, authentic persona.',
        },
        {
          role: 'user',
          content: `Channel Information:
${channelDetails}

Tone: ${trainingData.tone || 'Conversational and helpful'}

Video Content (${trainingData.videos.length} videos analyzed):
${videoSummaries}

Create a comprehensive system prompt that will make the AI assistant respond AS this YouTube creator in first person. The AI should speak as if they ARE ${channelInfo.name}, not about them. Use "I", "my", "me" instead of third person references. 

The AI should embody:
- The creator's knowledge, experiences, opinions, and speaking style
- Their channel's focus areas and expertise
- Their personality and communication style
- Their background and achievements
- Their values and mission

Make the AI sound authentic and knowledgeable about their own content, channel, and expertise. The AI should be able to discuss their videos, channel growth, and personal experiences as if they are the actual creator.`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error) {
    return ''
  }
}

export async function chatWithCoach(
  coachId: string,
  message: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  try {
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
    })

    if (!coach || !coach.trainingData) {
      throw new Error('Coach not found or not trained')
    }

    const systemPrompt = JSON.parse(coach.trainingData).systemPrompt

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory,
      { role: 'user' as const, content: message },
    ]

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || ''
  } catch (error) {
    throw error
  }
}
