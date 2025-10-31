const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateShareableId() {
  try {
    const coachName = process.argv[2] || 'Nick' // Default to Nick
    const newShareableId = process.argv[3] || '124087a6-76e1-4316-9add-c2594a65806a'
        
    // Find coach by name
    const coach = await prisma.coach.findFirst({
      where: { name: coachName }
    })
    
    if (!coach) {
      console.error(`Coach "${coachName}" not found`)
      const allCoaches = await prisma.coach.findMany({
        select: { name: true, shareableId: true }
      })
      return
    }
    
    // Check if new shareableId is already taken
    const existing = await prisma.coach.findUnique({
      where: { shareableId: newShareableId }
    })
    
    if (existing && existing.id !== coach.id) {
      console.error(`ShareableId ${newShareableId} is already taken by coach: ${existing.name}`)
      return
    }
    
    // Update the shareableId
    const updated = await prisma.coach.update({
      where: { id: coach.id },
      data: { 
        shareableId: newShareableId,
        isPublic: true // Also make it public
      }
    })
  
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateShareableId()

