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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { status, notes } = body

    // Verify the lead belongs to a coach owned by this user
    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
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

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Update the lead
    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        status: status || lead.status,
        notes: notes !== undefined ? notes : lead.notes,
        updatedAt: new Date()
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

    return NextResponse.json({
      lead: {
        id: updatedLead.id,
        email: updatedLead.email,
        name: updatedLead.name,
        phone: updatedLead.phone,
        coach: updatedLead.coach.name || updatedLead.coach.channelName || 'Unknown Coach',
        source: updatedLead.source,
        status: updatedLead.status,
        notes: updatedLead.notes,
        createdAt: updatedLead.createdAt,
        updatedAt: updatedLead.updatedAt,
        metadata: updatedLead.metadata ? JSON.parse(updatedLead.metadata) : null
      }
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the lead belongs to a coach owned by this user
    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        coach: {
          userId: user.id
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Delete the lead
    await prisma.lead.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
