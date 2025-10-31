const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkShareableId() {
  try {
    const shareableId = process.argv[2] || '124087a6-76e1-4316-9add-c2594a65806a'
    
    console.log(`Checking for shareableId: ${shareableId}`)
    
    // Check with findUnique
    const coach1 = await prisma.coach.findUnique({
      where: { shareableId }
    })
    
    console.log('findUnique result:', coach1 ? 'Found' : 'Not found')
    
    // Check with findFirst
    const coach2 = await prisma.coach.findFirst({
      where: { shareableId }
    })
    
    console.log('findFirst result:', coach2 ? 'Found' : 'Not found')
    
    // Get all coaches with shareableIds
    const allCoaches = await prisma.coach.findMany({
      select: {
        id: true,
        name: true,
        shareableId: true,
        isPublic: true
      }
    })
    
    console.log('\nAll coaches in database:')
    allCoaches.forEach(c => {
      console.log(`  - ${c.name}: shareableId=${c.shareableId}, isPublic=${c.isPublic}`)
    })
    
    // Check if exact match exists
    const exactMatch = allCoaches.find(c => c.shareableId === shareableId)
    if (exactMatch) {
      console.log(`\n✅ Found exact match! Name: ${exactMatch.name}, isPublic: ${exactMatch.isPublic}`)
    } else {
      console.log(`\n❌ No exact match found for shareableId: ${shareableId}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkShareableId()

