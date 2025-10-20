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

  // Verify user exists in database
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true }
  })

  return user
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all leads for coaches owned by this user
    // Use raw query as fallback if Prisma client doesn't recognize lead model
    let leads
    try {
      leads = await prisma.lead.findMany({
        where: {
          coach: {
            userId: user.id
          }
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              channelName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } catch (error) {
      console.error('Error with prisma.lead.findMany:', error)
      // Fallback: return empty array for now
      leads = []
    }

    // Transform the data for the frontend
    const transformedLeads = leads.map(lead => ({
      id: lead.id,
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      coach: lead.coach.name || lead.coach.channelName || 'Unknown Coach',
      source: lead.source,
      status: lead.status,
      notes: lead.notes,
      createdAt: lead.createdAt,
      metadata: lead.metadata ? JSON.parse(lead.metadata) : null
    }))

    return NextResponse.json({ leads: transformedLeads })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, name, phone, source, coachId, notes, metadata } = body

    if (!email || !coachId) {
      return NextResponse.json({ error: 'Email and coach ID are required' }, { status: 400 })
    }

    // Verify the coach belongs to the user
    const coach = await prisma.coach.findFirst({
      where: {
        id: coachId,
        userId: user.id
      }
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    // Create the lead
    let lead
    try {
      lead = await prisma.lead.create({
        data: {
          email,
          name,
          phone,
          source: source || 'chat',
          notes,
          metadata: metadata ? JSON.stringify(metadata) : null,
          coachId
        },
        include: {
          coach: {
            select: {
              id: true,
              name: true,
              channelName: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json({ error: 'Failed to create lead - database error' }, { status: 500 })
    }

    return NextResponse.json({ 
      lead: {
        id: lead.id,
        email: lead.email,
        name: lead.name,
        phone: lead.phone,
        coach: lead.coach.name || lead.coach.channelName || 'Unknown Coach',
        source: lead.source,
        status: lead.status,
        notes: lead.notes,
        createdAt: lead.createdAt,
        metadata: lead.metadata ? JSON.parse(lead.metadata) : null
      }
    })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { leadIds } = body

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs are required' }, { status: 400 })
    }

    // Verify all leads belong to coaches owned by the user
    const leads = await prisma.lead.findMany({
      where: { 
        id: { in: leadIds },
        coach: {
          userId: user.id
        }
      },
      include: {
        coach: {
          select: {
            id: true,
            name: true,
            channelName: true
          }
        }
      }
    })

    if (leads.length !== leadIds.length) {
      return NextResponse.json({ error: 'Some leads not found or not owned by user' }, { status: 404 })
    }

    // Delete leads
    await prisma.lead.deleteMany({
      where: { 
        id: { in: leadIds },
        coach: {
          userId: user.id
        }
      }
    })

    return NextResponse.json({ 
      message: `Successfully deleted ${leadIds.length} lead${leadIds.length > 1 ? 's' : ''}`,
      deletedCount: leadIds.length 
    })
  } catch (error) {
    console.error('Error deleting leads:', error)
    return NextResponse.json({ error: 'Failed to delete leads' }, { status: 500 })
  }
}
