import { NextResponse } from "next/server"
import { startTrainingProcess } from "../coaches/route"

export async function POST(req: Request) {
  try {
    const { coachId } = await req.json()

    if (!coachId) {
      return NextResponse.json({ error: 'Coach ID is required' }, { status: 400 })
    }

    // Start the training process
    const result = await startTrainingProcess(coachId)
    
    return NextResponse.json({
      success: true,
      message: 'Training process completed',
      result
    })
  } catch (error) {
    console.error('❌ Training process failed:', error)
    return NextResponse.json({ 
      error: 'Training process failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
