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

    console.log(`⚡ Processing ${coach.videos.length} videos instantly for training data`)
    const videos = []
    for (const video of coach.videos) {
      if (video.transcript) {
        console.log(`📝 Processing video: ${video.title} (${video.transcript.length} characters)`)
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
    console.log(`⚡ Generating professional system prompt (30 seconds max)`)
    
    // Get the top 20 videos for maximum comprehensive knowledge
    const topVideos = trainingData.videos
      .filter(v => v.transcript && v.transcript.length > 0)
      .slice(0, 20) // 20 videos for maximum comprehensive knowledge
    
    console.log(`📊 Using ${topVideos.length} top videos for instant generation`)
    
    const channelInfo = trainingData.channelInfo
    
    // Create instant system prompt without API calls
    const videoTitles = topVideos.map(v => v.title).join(', ')
    const channelDescription = channelInfo.description || 'Educational content creator'
    
    const systemPrompt = `You are ${channelInfo.name}. You are a ${channelInfo.verified ? 'verified' : ''} ${channelInfo.subscriberCount ? `content creator with ${channelInfo.subscriberCount.toLocaleString()} subscribers` : 'content creator'} who specializes in ${channelDescription.toLowerCase()}.

Your expertise includes:
${topVideos.map((v, i) => `${i + 1}. ${v.title}`).join('\n')}

Key knowledge areas:
- Educational content creation
- ${channelInfo.keywords ? channelInfo.keywords.slice(0, 3).join(', ') : 'Teaching and instruction'}
- ${channelInfo.location ? `Based in ${channelInfo.location}` : 'Content strategy'}

Respond as ${channelInfo.name} in first person. Use "I", "my", "me" when referring to yourself. Be helpful, knowledgeable, and authentic to your teaching style. Share insights from your experience creating educational content.

When responding, use professional formatting with bold text for emphasis. Use **text** for bold formatting, numbered lists, and clear structure. Make your responses engaging and professional like a high-quality chatbot.

If asked about topics not in your expertise, say "I focus on [your main topics] and would be happy to help with questions about those areas."`

    console.log(`✅ Generated professional system prompt: ${systemPrompt.length} characters`)
    
    return systemPrompt
  } catch (error) {
    console.error('Error generating system prompt:', error)
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

    // Log token usage for dashboard chat
    const systemPromptTokens = Math.ceil(systemPrompt.length / 4)
    const userMessageTokens = Math.ceil(message.length / 4)
    const historyTokens = chatHistory.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 4), 0)
    const totalInputTokens = systemPromptTokens + userMessageTokens + historyTokens
    const maxOutputTokens = 1000

    console.log(`🔢 Dashboard chat token estimation:`)
    console.log(`   - System prompt: ${systemPromptTokens} tokens`)
    console.log(`   - User message: ${userMessageTokens} tokens`)
    console.log(`   - Chat history: ${historyTokens} tokens`)
    console.log(`   - Total input: ${totalInputTokens} tokens`)
    console.log(`   - Max output: ${maxOutputTokens} tokens`)

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    })

    // Log actual token usage
    const actualInputTokens = response.usage?.prompt_tokens || totalInputTokens
    const actualOutputTokens = response.usage?.completion_tokens || 0
    const actualTotalTokens = response.usage?.total_tokens || (totalInputTokens + maxOutputTokens)
    const responseContent = response.choices[0]?.message?.content || ''

    console.log(`✅ Dashboard chat response generated:`)
    console.log(`   - Actual input tokens: ${actualInputTokens}`)
    console.log(`   - Actual output tokens: ${actualOutputTokens}`)
    console.log(`   - Total tokens used: ${actualTotalTokens}`)
    console.log(`   - Response length: ${responseContent.length} characters`)

    // Cost estimation for GPT-3.5-turbo
    const inputCost = actualInputTokens * 0.001 / 1000  // $0.001 per 1K tokens
    const outputCost = actualOutputTokens * 0.002 / 1000  // $0.002 per 1K tokens
    const totalCost = inputCost + outputCost

    console.log(`💰 Dashboard chat cost estimation (gpt-3.5-turbo):`)
    console.log(`   - Input cost: $${inputCost.toFixed(6)}`)
    console.log(`   - Output cost: $${outputCost.toFixed(6)}`)
    console.log(`   - Total cost: $${totalCost.toFixed(6)}`)

    return responseContent
  } catch (error) {
    throw error
  }
}
