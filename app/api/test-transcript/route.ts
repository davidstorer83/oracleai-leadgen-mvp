import { NextResponse } from "next/server"
import { getVideoTranscript, getVideoTranscriptAlternative, getVideoTranscriptWithRetry } from "@/lib/youtube"

export async function POST(req: Request) {
  try {
    const { videoId, method = 'all' } = await req.json()

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    console.log(`🧪 Testing transcript methods for video: ${videoId}`)
    
    const results: any = {
      videoId,
      methods: {}
    }

    // Test primary method
    if (method === 'all' || method === 'primary') {
      console.log(`📝 Testing primary transcript method...`)
      try {
        const startTime = Date.now()
        const transcript = await getVideoTranscript(videoId)
        const duration = Date.now() - startTime
        
        results.methods.primary = {
          success: !!transcript,
          transcript: transcript ? transcript.substring(0, 200) + '...' : null,
          length: transcript?.length || 0,
          duration: `${duration}ms`
        }
      } catch (error) {
        results.methods.primary = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: '0ms'
        }
      }
    }

    // Test alternative method
    if (method === 'all' || method === 'alternative') {
      console.log(`📝 Testing alternative transcript method...`)
      try {
        const startTime = Date.now()
        const transcript = await getVideoTranscriptAlternative(videoId)
        const duration = Date.now() - startTime
        
        results.methods.alternative = {
          success: !!transcript,
          transcript: transcript ? transcript.substring(0, 200) + '...' : null,
          length: transcript?.length || 0,
          duration: `${duration}ms`
        }
      } catch (error) {
        results.methods.alternative = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: '0ms'
        }
      }
    }

    // Test retry method
    if (method === 'all' || method === 'retry') {
      console.log(`📝 Testing retry transcript method...`)
      try {
        const startTime = Date.now()
        const transcript = await getVideoTranscriptWithRetry(videoId, 2)
        const duration = Date.now() - startTime
        
        results.methods.retry = {
          success: !!transcript,
          transcript: transcript ? transcript.substring(0, 200) + '...' : null,
          length: transcript?.length || 0,
          duration: `${duration}ms`
        }
      } catch (error) {
        results.methods.retry = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: '0ms'
        }
      }
    }

    // Summary
    const successfulMethods = Object.values(results.methods).filter((method: any) => method.success)
    results.summary = {
      totalMethods: Object.keys(results.methods).length,
      successfulMethods: successfulMethods.length,
      bestMethod: successfulMethods.length > 0 ? 
        Object.keys(results.methods).find(key => results.methods[key].success) : null,
      hasTranscript: successfulMethods.length > 0
    }

    console.log(`📊 Transcript test results:`, results.summary)

    return NextResponse.json({
      success: true,
      message: 'Transcript testing completed',
      results
    })
  } catch (error) {
    console.error('❌ Transcript testing failed:', error)
    return NextResponse.json({ 
      error: 'Transcript testing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
