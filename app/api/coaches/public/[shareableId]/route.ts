import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareableId: string }> }
) {
  try {
    const { shareableId } = await params

    const coach = await prisma.coach.findUnique({
      where: { 
        shareableId,
        isPublic: true
      },
      select: {
        id: true,
        name: true,
        channelName: true,
        avatar: true,
        description: true,
        metadata: true,
        createdAt: true
      }
    })

    if (!coach) {
      return NextResponse.json(
        { error: 'Coach not found or not public' },
        { status: 404 }
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
