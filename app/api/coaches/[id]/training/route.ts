import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // Verify coach belongs to user
    const coach = await prisma.coach.findFirst({
      where: { 
        id,
        userId: user.id,
      },
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const trainingJobs = await prisma.trainingJob.findMany({
      where: { coachId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ trainingJobs })
  } catch (error) {
    console.error('Error fetching training status:', error)
    return NextResponse.json({ error: 'Failed to fetch training status' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Verify coach belongs to user
    const coach = await prisma.coach.findFirst({
      where: { 
        id,
        userId: user.id,
      },
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    // Start retraining process
    const { startTrainingProcess } = await import('../../route')
    await startTrainingProcess(id)

    return NextResponse.json({ message: 'Retraining started' })
  } catch (error) {
    console.error('Error starting retraining:', error)
    return NextResponse.json({ error: 'Failed to start retraining' }, { status: 500 })
  }
}
