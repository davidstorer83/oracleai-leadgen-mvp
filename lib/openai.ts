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
    const coach = await prisma.coach.findUnique({
      where: { id: coachId },
      include: {
        videos: true,
      },
    })

    if (!coach) {
      return null
    }
    const videos = []
    for (const video of coach.videos) {
      if (video.transcript) {
        // Create instant summary without API calls
        const summary = `Educational content: ${video.title}. Key topics covered in this video.`
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
      }
    }

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
    // Get the top 20 videos for maximum comprehensive knowledge
    const topVideos = trainingData.videos
      .filter(v => v.transcript && v.transcript.length > 0)
      .slice(0, 20) // 20 videos for maximum comprehensive knowledge

    const channelInfo = trainingData.channelInfo
    
    // Create instant system prompt without API calls
    const videoTitles = topVideos.map(v => v.title).join(', ')
    const channelDescription = channelInfo.description || 'Educational content creator'
    
    // Create a natural first-person introduction
    const introMessage = `Hey there! I'm ${channelInfo.name}${channelInfo.verified ? ' — a verified' : ''}${channelInfo.subscriberCount ? ` content creator with ${channelInfo.subscriberCount.toLocaleString()} subscribers` : ''} who specializes in ${channelDescription} 😄

So, what's something you've been thinking about lately?`

    const systemPrompt = `You are ${channelInfo.name}. You are a ${channelInfo.verified ? 'verified' : ''} ${channelInfo.subscriberCount ? `content creator with ${channelInfo.subscriberCount.toLocaleString()} subscribers` : 'content creator'} who specializes in ${channelDescription}.

Your expertise includes:
${topVideos.map((v, i) => `${i + 1}. ${v.title}`).join('\n')}

Key knowledge areas:
- Educational content creation
- ${channelInfo.keywords ? channelInfo.keywords.slice(0, 3).join(', ') : 'Teaching and instruction'}
- ${channelInfo.location ? `Based in ${channelInfo.location}` : 'Content strategy'}

IMPORTANT: When a user starts a new conversation, always begin with this exact message: "${introMessage}"

Respond as ${channelInfo.name} in first person. Use "I", "my", "me" when referring to yourself. Be helpful, knowledgeable, and authentic to your teaching style. Share insights from your experience creating educational content.

When responding, use professional formatting with bold text for emphasis. Use **text** for bold formatting, numbered lists, and clear structure. Make your responses engaging and professional like a high-quality chatbot.

If asked about topics not in your expertise, say "I focus on [your main topics] and would be happy to help with questions about those areas."`

    return systemPrompt
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

    // Create a professional, natural system prompt
    let systemPrompt = `You are ${coach.name || coach.channelName}. You are having a natural conversation with someone who wants to learn from you.

IMPORTANT RULES:
- Respond as yourself, not as an AI or bot
- Be conversational and natural, like you're talking to a friend
- Don't repeat your introduction or background unless specifically asked
- Don't mention that you're an AI or that this is a chatbot
- Answer questions directly and personally
- Use "I", "my", "me" when referring to yourself
- Be helpful and share your knowledge naturally
- If you don't know something specific, say so naturally without mentioning AI limitations

Your personality and expertise:`

    // Add personal information from metadata
    if (coach.metadata) {
      try {
        const metadata = JSON.parse(coach.metadata)
        
        if (metadata.subscriberCount) {
          systemPrompt += `\n- You have ${metadata.subscriberCount.toLocaleString()} subscribers on your YouTube channel.`
        }
        if (metadata.videoCount) {
          systemPrompt += `\n- You've created ${metadata.videoCount} videos.`
        }
        if (metadata.location) {
          systemPrompt += `\n- You're based in ${metadata.location}.`
        }
        if (metadata.verified) {
          systemPrompt += `\n- You have a verified YouTube channel.`
        }
        if (metadata.keywords && metadata.keywords.length > 0) {
          systemPrompt += `\n- Your main topics include: ${metadata.keywords.slice(0, 5).join(', ')}.`
        }
      } catch (e) {
        // If metadata parsing fails, continue with basic prompt
      }
    }

    // Add the coach's description if available
    if (coach.description) {
      systemPrompt += `\n\nAbout you: ${coach.description}`
    }

    systemPrompt += `\n\nRespond naturally and conversationally. Don't repeat your introduction. Just answer the person's question directly and helpfully.`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory,
      { role: 'user' as const, content: message },
    ]

    const systemPromptTokens = Math.ceil(systemPrompt.length / 4)
    const userMessageTokens = Math.ceil(message.length / 4)
    const historyTokens = chatHistory.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 4), 0)
    const totalInputTokens = systemPromptTokens + userMessageTokens + historyTokens
    const maxOutputTokens = 300

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 300,
      temperature: 0.7,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    })

    const actualInputTokens = response.usage?.prompt_tokens || totalInputTokens
    const actualOutputTokens = response.usage?.completion_tokens || 0
    const actualTotalTokens = response.usage?.total_tokens || (totalInputTokens + maxOutputTokens)
    const responseContent = response.choices[0]?.message?.content || ''

    const inputCost = actualInputTokens * 0.001 / 1000  // $0.001 per 1K tokens
    const outputCost = actualOutputTokens * 0.002 / 1000  // $0.002 per 1K tokens
    const totalCost = inputCost + outputCost

    return responseContent
  } catch (error) {
    throw error
  }
}

