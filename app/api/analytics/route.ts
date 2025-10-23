import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const user = await verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's coaches with related data
    const coaches = await prisma.coach.findMany({
      where: { userId: user.id },
      include: {
        chats: {
          include: {
            messages: true
          }
        },
        leads: true,
        videos: true,
        _count: {
          select: {
            chats: true,
            leads: true,
            videos: true
          }
        }
      }
    })

    // Calculate analytics data
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Daily data for the last 7 days
    const dailyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const dayChats = coaches.flatMap(coach => 
        coach.chats.filter(chat => 
          chat.createdAt >= dayStart && chat.createdAt < dayEnd
        )
      )

      const dayMessages = dayChats.reduce((sum, chat) => sum + chat.messages.length, 0)
      const dayLeads = coaches.flatMap(coach => 
        coach.leads.filter(lead => 
          lead.createdAt >= dayStart && lead.createdAt < dayEnd
        )
      )

      dailyData.push({
        date: dayStart.toISOString().split('T')[0],
        day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        chats: dayChats.length,
        messages: dayMessages,
        leads: dayLeads.length,
        revenue: dayLeads.length * 50 // Estimated $50 per lead
      })
    }

    // Calculate totals and growth
    const totalCoaches = coaches.length
    const readyCoaches = coaches.filter(c => c.status === 'READY').length
    const trainingCoaches = coaches.filter(c => c.status === 'TRAINING').length
    const errorCoaches = coaches.filter(c => c.status === 'ERROR').length

    const totalChats = coaches.reduce((sum, coach) => sum + coach._count.chats, 0)
    const totalMessages = coaches.reduce((sum, coach) => 
      sum + coach.chats.reduce((chatSum, chat) => chatSum + chat.messages.length, 0), 0
    )
    const totalLeads = coaches.reduce((sum, coach) => sum + coach._count.leads, 0)
    const totalVideos = coaches.reduce((sum, coach) => sum + coach._count.videos, 0)

    // Calculate growth rates (comparing last 7 days vs previous 7 days)
    const last7DaysData = dailyData.slice(-7)
    const previous7DaysData = dailyData.slice(-14, -7)
    
    const last7DaysChats = last7DaysData.reduce((sum, day) => sum + day.chats, 0)
    const previous7DaysChats = previous7DaysData.reduce((sum, day) => sum + day.chats, 0)
    const chatsGrowth = previous7DaysChats > 0 
      ? Math.round(((last7DaysChats - previous7DaysChats) / previous7DaysChats) * 100)
      : 0

    const last7DaysLeads = last7DaysData.reduce((sum, day) => sum + day.leads, 0)
    const previous7DaysLeads = previous7DaysData.reduce((sum, day) => sum + day.leads, 0)
    const leadsGrowth = previous7DaysLeads > 0 
      ? Math.round(((last7DaysLeads - previous7DaysLeads) / previous7DaysLeads) * 100)
      : 0

    const last7DaysMessages = last7DaysData.reduce((sum, day) => sum + day.messages, 0)
    const previous7DaysMessages = previous7DaysData.reduce((sum, day) => sum + day.messages, 0)
    const messagesGrowth = previous7DaysMessages > 0 
      ? Math.round(((last7DaysMessages - previous7DaysMessages) / previous7DaysMessages) * 100)
      : 0

    // Coach performance data
    const coachPerformance = coaches.map(coach => ({
      id: coach.id,
      name: coach.name,
      channelName: coach.channelName,
      avatar: coach.avatar,
      status: coach.status,
      totalChats: coach._count.chats,
      totalLeads: coach._count.leads,
      totalVideos: coach._count.videos,
      conversionRate: coach._count.chats > 0 
        ? Math.round((coach._count.leads / coach._count.chats) * 100) 
        : 0,
      lastActivity: coach.chats.length > 0 
        ? Math.max(...coach.chats.map(chat => new Date(chat.updatedAt).getTime()))
        : new Date(coach.createdAt).getTime()
    })).sort((a, b) => b.totalChats - a.totalChats)

    // Recent activity (last 10 chats)
    const recentChats = coaches
      .flatMap(coach => 
        coach.chats.map(chat => ({
          ...chat,
          coachName: coach.name,
          coachAvatar: coach.avatar,
          messageCount: chat.messages.length
        }))
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)

    return NextResponse.json({
      dailyData,
      totals: {
        coaches: totalCoaches,
        readyCoaches,
        trainingCoaches,
        errorCoaches,
        chats: totalChats,
        messages: totalMessages,
        leads: totalLeads,
        videos: totalVideos,
        revenue: totalLeads * 50
      },
      growth: {
        chats: chatsGrowth,
        leads: leadsGrowth,
        messages: messagesGrowth
      },
      coachPerformance,
      recentChats
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
