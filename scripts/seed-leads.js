const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedLeads() {
  try {
    // Get the first coach to associate leads with
    const coach = await prisma.coach.findFirst()
    
    if (!coach) {
      return
    }


    const sampleLeads = [
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        phone: '+1-555-0123',
        source: 'chat',
        status: 'new',
        notes: 'Interested in business coaching',
        coachId: coach.id,
        metadata: JSON.stringify({
          firstMessage: 'Hi, I need help with my startup',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        })
      },
      {
        email: 'sarah.wilson@example.com',
        name: 'Sarah Wilson',
        phone: '+1-555-0456',
        source: 'embed',
        status: 'contacted',
        notes: 'Followed up via email',
        coachId: coach.id,
        metadata: JSON.stringify({
          firstMessage: 'Looking for career advice',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
        })
      },
      {
        email: 'mike.chen@example.com',
        name: 'Mike Chen',
        phone: '+1-555-0789',
        source: 'landing',
        status: 'qualified',
        notes: 'High potential lead, interested in premium coaching',
        coachId: coach.id,
        metadata: JSON.stringify({
          firstMessage: 'I want to scale my business',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        })
      },
      {
        email: 'emma.brown@example.com',
        name: 'Emma Brown',
        phone: '+1-555-0321',
        source: 'chat',
        status: 'converted',
        notes: 'Signed up for premium coaching package',
        coachId: coach.id,
        metadata: JSON.stringify({
          firstMessage: 'Need help with productivity',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
        })
      },
      {
        email: 'alex.garcia@example.com',
        name: 'Alex Garcia',
        phone: '+1-555-0654',
        source: 'chat',
        status: 'new',
        notes: 'Just started chatting, very interested',
        coachId: coach.id,
        metadata: JSON.stringify({
          firstMessage: 'Hello, I have some questions about entrepreneurship',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
        })
      }
    ]

    for (const leadData of sampleLeads) {
      const lead = await prisma.lead.create({
        data: {
          ...leadData,
          createdAt: new Date(leadData.metadata ? JSON.parse(leadData.metadata).timestamp : new Date())
        }
      })
    }

  } catch (error) {
    console.error('Error seeding leads:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedLeads()
