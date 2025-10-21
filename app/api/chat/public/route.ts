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

    // Get system prompt from coach metadata (pre-generated during training)
    let systemPrompt = `You are ${coach.name}. You must ONLY respond based on your knowledge and expertise. Do not use any external knowledge or generic information. Only answer questions using your specific knowledge and experiences. If the question cannot be answered from your knowledge, say "I don't have specific information about that, but I'd be happy to help with something else based on my expertise."`

    try {
      if (coach.metadata) {
        const metadata = JSON.parse(coach.metadata)
        if (metadata.systemPrompt) {
          systemPrompt = metadata.systemPrompt
        }
      }
    } catch (e) {
      // Error parsing metadata
    }

    // Check if coach has training data
    const videosWithTranscripts = coach.videos.filter(video => video.transcript && video.transcript.length > 0)
    
    if (videosWithTranscripts.length === 0) {
      return NextResponse.json({ 
        message: "I don't have any training content available at the moment. Please check back later." 
      })
    }

    const systemPromptTokens = Math.ceil(systemPrompt.length / 4)
    const userMessageTokens = Math.ceil(message.length / 4)
    const totalInputTokens = systemPromptTokens + userMessageTokens
    const maxOutputTokens = 500

    let completion
    try {
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.3,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
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
