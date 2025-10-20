'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Play, RefreshCw } from 'lucide-react'

export default function TestYouTubePage() {
  const [coachId, setCoachId] = useState('cmgxxu94n000114nqwdsaxsls') // Iman Gadzhi's coach ID
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ') // Rick Roll video ID for testing
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testYouTubeAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl: 'https://www.youtube.com/@ImanGadzhi' })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to test YouTube API')
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const testEnhancedYouTubeAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-enhanced-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          channelUrl: 'https://www.youtube.com/@JacobCoofficial',
          maxVideos: 5 
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to test enhanced YouTube API')
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const retrainCoach = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/retrain-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coachId })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to retrain coach')
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const testTranscript = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, method: 'all' })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to test transcript')
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }


  const testTactiq = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-tactiq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          videoId: videoId.trim()
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to test Tactiq API')
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">YouTube API Testing</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Test YouTube API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test YouTube API
            </CardTitle>
            <CardDescription>
              Test the YouTube Data API v3 integration with Iman Gadzhi's channel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testYouTubeAPI} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing YouTube API...
                </>
              ) : (
                'Test YouTube API'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Enhanced YouTube API Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Enhanced YouTube API Test
            </CardTitle>
            <CardDescription>
              Test the enhanced YouTube API with comprehensive link extraction (Jacob & Co. example)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testEnhancedYouTubeAPI} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Enhanced YouTube API...
                </>
              ) : (
                'Test Enhanced YouTube API'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Retrain Coach */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Retrain Coach
            </CardTitle>
            <CardDescription>
              Retrain an existing coach with fresh YouTube data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Coach ID"
              value={coachId}
              onChange={(e) => setCoachId(e.target.value)}
            />
            <Button 
              onClick={retrainCoach} 
              disabled={loading || !coachId}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retraining Coach...
                </>
              ) : (
                'Retrain Coach'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Transcript
            </CardTitle>
            <CardDescription>
              Test transcript fetching methods with different videos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Video ID (e.g., dQw4w9WgXcQ)"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
            />
            <Button 
              onClick={testTranscript} 
              disabled={loading || !videoId}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Transcript...
                </>
              ) : (
                'Test Transcript'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Tactiq API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Tactiq API
            </CardTitle>
            <CardDescription>
              Test Tactiq API transcript extraction (most reliable method)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Video ID (e.g., P3v-eUd0dCw for shorts)"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
            />
            <Button 
              onClick={testTactiq} 
              disabled={loading || !videoId}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Tactiq API...
                </>
              ) : (
                'Test Tactiq API'
              )}
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Results */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
