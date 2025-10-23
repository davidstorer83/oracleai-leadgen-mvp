import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, coachId, shareableId } = await request.json()

    if (!message || !coachId) {
      return NextResponse.json(
        { error: 'Message and coachId are required' },
        { status: 400 }
      )
    }

    // Verify coach exists and is public
    const coach = await prisma.coach.findFirst({
      where: {
        OR: [
          { id: coachId, isPublic: true },
          { shareableId: shareableId, isPublic: true }
        ]
      },
      include: {
        videos: {
          where: {
            transcript: {
              not: ''
            }
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found or not public' },
        { status: 404 }
      )
    }

    // Create a natural, first-person system prompt
    let enhancedSystemPrompt = `You are ${coach.name}. You are having a natural conversation with someone who wants to learn from you. 

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
        
        // Add subscriber count if available
        if (metadata.subscriberCount) {
          enhancedSystemPrompt += `\n- You have ${metadata.subscriberCount.toLocaleString()} subscribers on your YouTube channel.`
        }
        
        // Add video count if available
        if (metadata.videoCount) {
          enhancedSystemPrompt += `\n- You've created ${metadata.videoCount} videos.`
        }
        
        // Add location if available
        if (metadata.location) {
          enhancedSystemPrompt += `\n- You're based in ${metadata.location}.`
        }
        
        // Add verification status
        if (metadata.verified) {
          enhancedSystemPrompt += `\n- You have a verified YouTube channel.`
        }
        
        // Add monetization status
        if (metadata.isMonetized) {
          enhancedSystemPrompt += `\n- Your channel is monetized.`
        }
        
        // Add keywords/topics
        if (metadata.keywords && metadata.keywords.length > 0) {
          enhancedSystemPrompt += `\n- Your main topics include: ${metadata.keywords.slice(0, 5).join(', ')}.`
        }
        
        // Add social media information
        if (metadata.socialMedia && Object.keys(metadata.socialMedia).length > 0) {
          const platforms = Object.keys(metadata.socialMedia).slice(0, 3)
          enhancedSystemPrompt += `\n- You're active on ${platforms.join(', ')}.`
        }
        
        // Add contact information
        if (metadata.contactInfo) {
          if (metadata.contactInfo.emails && metadata.contactInfo.emails.length > 0) {
            enhancedSystemPrompt += `\n- You can be reached at ${metadata.contactInfo.emails[0]}.`
          }
          if (metadata.contactInfo.websites && metadata.contactInfo.websites.length > 0) {
            enhancedSystemPrompt += `\n- You have a website at ${metadata.contactInfo.websites[0]}.`
          }
        }
        
      } catch (e) {
        // If metadata parsing fails, continue with basic prompt
      }
    }

    // Add the coach's description if available
    if (coach.description) {
      enhancedSystemPrompt += `\n\nAbout you: ${coach.description}`
    }

    enhancedSystemPrompt += `\n\nRespond naturally and conversationally. Don't repeat your introduction. Just answer the person's question directly and helpfully.`

    // For new conversations, add the natural intro message
    // Since this is a public chat without persistent history, we'll always show the intro
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi') || message.toLowerCase().includes('hey')) {
      const introMessage = `Hey there! I'm ${coach.name} — a content creator who specializes in ${coach.description || 'educational content'} 😄

So, what's something you've been thinking about lately?`
      
      return NextResponse.json({ 
        message: introMessage 
      })
    }

    // Check if coach has training data
    const videosWithTranscripts = coach.videos.filter((video: any) => video.transcript && video.transcript.length > 0)
    
    if (videosWithTranscripts.length === 0) {
      return NextResponse.json({ 
        message: "I don't have any training content available at the moment. Please check back later." 
      })
    }

    const systemPromptTokens = Math.ceil(enhancedSystemPrompt.length / 4)
    const userMessageTokens = Math.ceil(message.length / 4)
    const totalInputTokens = systemPromptTokens + userMessageTokens
    const maxOutputTokens = 500

    let completion
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: 'system', content: enhancedSystemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0.3,
        frequency_penalty: 0.3
      })
    } catch (error: any) {
      throw error
    }

    const response = completion.choices[0]?.message?.content || 'I apologize, but I cannot process your request at the moment.'
    
    const actualInputTokens = completion.usage?.prompt_tokens || totalInputTokens
    const actualOutputTokens = completion.usage?.completion_tokens || 0
    const actualTotalTokens = completion.usage?.total_tokens || (totalInputTokens + maxOutputTokens)
    
    const model = completion.model || 'gpt-3.5-turbo'
    const inputCost = actualInputTokens * 0.001 / 1000  // $0.001 per 1K tokens
    const outputCost = actualOutputTokens * 0.002 / 1000  // $0.002 per 1K tokens
    const totalCost = inputCost + outputCost

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error('Error in public chat:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

