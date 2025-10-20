import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

async function getCurrentUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return null
  }

  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  // Fetch the full user object from the database
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  })

  return user
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const coach = await prisma.coach.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/coach/${coach.shareableId}`

    return NextResponse.json({
      shareableId: coach.shareableId,
      isPublic: coach.isPublic,
      shareUrl,
      coach: {
        id: coach.id,
        name: coach.name,
        channelName: coach.channelName,
        avatar: coach.avatar
      }
    })
  } catch (error) {
    console.error('Error getting coach share info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { isPublic } = await req.json()

    const coach = await prisma.coach.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    // Update coach public status
    const updatedCoach = await prisma.coach.update({
      where: { id },
      data: { isPublic: Boolean(isPublic) }
    })

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/coach/${coach.shareableId}`

    return NextResponse.json({
      shareableId: updatedCoach.shareableId,
      isPublic: updatedCoach.isPublic,
      shareUrl,
      coach: {
        id: updatedCoach.id,
        name: updatedCoach.name,
        channelName: updatedCoach.channelName,
        avatar: updatedCoach.avatar
      }
    })
  } catch (error) {
    console.error('Error updating coach share status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
