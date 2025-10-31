import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareableId: string }> }
) {
  try {
    const { shareableId } = await params

    // Find by shareableId first (findUnique only works with unique fields)
    const coach = await prisma.coach.findUnique({
      where: { 
        shareableId
      },
      select: {
        id: true,
        name: true,
        channelName: true,
        avatar: true,
        description: true,
        metadata: true,
        createdAt: true,
        isPublic: true
      }
    })

    // Check if coach exists and is public
    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found' },
        { status: 404 }
      )
    }

    if (!coach.isPublic) {
      return NextResponse.json(
        { error: 'Coach is not public' },
        { status: 403 }
      )
    }

    return NextResponse.json(coach)
  } catch (error) {
    console.error('Error fetching public coach:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
