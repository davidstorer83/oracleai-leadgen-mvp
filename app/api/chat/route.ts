import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { chatWithCoach } from "@/lib/openai"
import { verifyToken } from "@/lib/auth"

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

  // Get full user data from database
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true }
  })

  return user
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { message, coachId, chatId } = body

    if (!message || !coachId) {
      return NextResponse.json({ error: 'Message and coachId are required' }, { status: 400 })
    }

    // Verify coach belongs to user
    const coach = await prisma.coach.findFirst({
      where: { id: coachId, userId: user.id },
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    // Get or create chat
    let chat
    if (chatId) {
      chat = await prisma.chat.findFirst({
        where: { id: chatId, userId: user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    } else {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          coachId,
          userId: user.id,
        },
        include: { messages: true },
      })

      // Create a lead for this new chat interaction
      try {
        await prisma.lead.create({
          data: {
            email: user.email || 'unknown@example.com',
            name: user.name || 'Unknown User',
            source: 'chat',
            status: 'new',
            notes: `Started chat with ${coach.name || coach.channelName}`,
            coachId: coachId,
            metadata: JSON.stringify({
              chatId: chat.id,
              firstMessage: message.slice(0, 100),
              userAgent: req.headers.get('user-agent'),
              timestamp: new Date().toISOString()
            })
          }
        })
      } catch (leadError) {
        // Don't fail the chat if lead creation fails
        console.error('Failed to create lead for chat:', leadError)
      }
    }

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    // Get chat history
    const chatHistory = chat.messages.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
    }))

    // For new conversations, save the user message and get AI response
    if (chatHistory.length === 0) {
      // Save user message first
      await prisma.message.create({
        data: {
          content: message,
          role: 'USER',
          chatId: chat.id,
        },
      })
      
      // Get AI response
      const response = await chatWithCoach(coachId, message, [])
      
      // Save AI response
      await prisma.message.create({
        data: {
          content: response,
          role: 'ASSISTANT',
          chatId: chat.id,
        },
      })

      return NextResponse.json({ 
        response, 
        chatId: chat.id,
        chatTitle: chat.title 
      })
    }

    // Get AI response
    const response = await chatWithCoach(coachId, message, chatHistory)

    // Save user message
    await prisma.message.create({
      data: {
        content: message,
        role: 'USER',
        chatId: chat.id,
      },
    })

    // Save AI response
    await prisma.message.create({
      data: {
        content: response,
        role: 'ASSISTANT',
        chatId: chat.id,
      },
    })

    return NextResponse.json({ 
      response, 
      chatId: chat.id,
      chatTitle: chat.title 
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
