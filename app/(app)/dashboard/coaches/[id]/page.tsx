"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Trash2, ExternalLink, Clock, CheckCircle, AlertCircle, RefreshCw, Share2, Copy, Loader2 } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

const fetcher = (url: string) => {
  const token = localStorage.getItem('auth-token')
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((r) => r.json())
}

export default function CoachDetailPage() {
  const params = useParams()
  const { data, mutate } = useSWR(`/api/coaches/${params.id}`, fetcher)
  const { data: trainingData, mutate: mutateTraining } = useSWR(`/api/coaches/${params.id}/training`, fetcher)
  const { data: shareData, mutate: mutateShare } = useSWR(`/api/coaches/${params.id}/share`, fetcher)
  const [isRetraining, setIsRetraining] = useState(false)
  const [isTogglingShare, setIsTogglingShare] = useState(false)

  const coach = data?.coach
  const trainingJobs = trainingData?.trainingJobs || []
  const latestJob = trainingJobs[0]

  const handleRetrain = async () => {
    if (!confirm('Are you sure you want to retrain this coach? This will regenerate the AI personality and may take a few minutes.')) {
      return
    }

    setIsRetraining(true)
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/coaches/${params.id}/training`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to start retraining')
      }

      // Refresh the data
      mutate()
      mutateTraining()
    } catch (error) {
      console.error('Error retraining coach:', error)
      alert('Failed to start retraining. Please try again.')
    } finally {
      setIsRetraining(false)
    }
  }

  const handleToggleShare = async () => {
    setIsTogglingShare(true)
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/coaches/${params.id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublic: !shareData?.isPublic
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update share status')
      }

      await mutateShare()
      alert(shareData?.isPublic ? 'Coach is now private' : 'Coach is now public and shareable!')
    } catch (error) {
      console.error('Error toggling share status:', error)
      alert('Failed to update share status. Please try again.')
    } finally {
      setIsTogglingShare(false)
    }
  }

  const handleCopyShareLink = async () => {
    if (shareData?.shareUrl) {
      try {
        await navigator.clipboard.writeText(shareData.shareUrl)
        alert('Share link copied to clipboard!')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        alert('Failed to copy link. Please copy manually.')
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'TRAINING':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'TRAINING':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'ERROR':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'READY':
        return 'Coach is ready to chat!'
      case 'TRAINING':
        return 'Training in progress... This may take a few minutes.'
      case 'ERROR':
        return 'Training failed. Please retry.'
      default:
        return 'Unknown status'
    }
  }

  if (!coach) {
    return (
      <div className="mx-auto max-w-8xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/coaches" className="text-muted-foreground hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-white">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-secondary border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {getStatusIcon(coach.status)}
              Training Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={`${getStatusColor(coach.status)} border`}>
                {coach.status}
              </Badge>
            </div>
            
            {/* Status Message */}
            <div className="p-3 rounded-lg bg-muted/20 border border-muted/30">
              <p className="text-sm text-muted-foreground">
                {getStatusMessage(coach.status)}
              </p>
            </div>

            {/* Training Progress for TRAINING status */}
            {coach.status === 'TRAINING' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Training Progress</span>
                  <span className="text-yellow-500">In Progress</span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Analyzing YouTube channel data</p>
                  <p>• Extracting video transcripts</p>
                  <p>• Generating training data</p>
                  <p>• Creating AI system prompt</p>
                </div>
              </div>
            )}
            
            {latestJob && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm text-white">{latestJob.progress}%</span>
                </div>
                <Progress value={latestJob.progress} className="w-full" />
                
                {latestJob.error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-500">Error: {latestJob.error}</p>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Videos Processed</span>
              <span className="text-sm text-white">{coach.videos?.length || 0}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Chats</span>
              <span className="text-sm text-white">{coach.chats?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary border-border">
          <CardHeader>
            <CardTitle className="text-white">Channel Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-muted-foreground">Channel URL</span>
              <div className="flex items-center gap-2 mt-1">
                <a 
                  href={coach.channelUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  {coach.channelUrl}
                </a>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            {coach.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description</span>
                <p className="text-sm text-white mt-1">{coach.description}</p>
              </div>
            )}

            {coach.tone && (
              <div>
                <span className="text-sm text-muted-foreground">Tone & Style</span>
                <p className="text-sm text-white mt-1">{coach.tone}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm text-white">
                {new Date(coach.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* YouTube Channel Statistics */}
        {coach.metadata && (() => {
          try {
            const metadata = JSON.parse(coach.metadata)
            return (
              <Card className="bg-secondary border-border">
                <CardHeader>
                  <CardTitle className="text-white">YouTube Channel Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Subscribers</span>
                      <span className="text-sm text-white font-semibold">
                        {metadata.subscriberCount ? metadata.subscriberCount.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Videos</span>
                      <span className="text-sm text-white font-semibold">
                        {metadata.videoCount ? metadata.videoCount.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Views</span>
                      <span className="text-sm text-white font-semibold">
                        {metadata.totalViews ? metadata.totalViews.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Verified</span>
                      <Badge variant={metadata.verified ? "default" : "secondary"}>
                        {metadata.verified ? "✓ Verified" : "Not Verified"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Monetized</span>
                      <Badge variant={metadata.isMonetized ? "default" : "secondary"}>
                        {metadata.isMonetized ? "✓ Monetized" : "Not Monetized"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Location</span>
                      <span className="text-sm text-white">
                        {metadata.location || 'Not specified'}
                      </span>
                    </div>
                  </div>
                  
                  {metadata.joinedDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Channel Created</span>
                      <span className="text-sm text-white">
                        {new Date(metadata.joinedDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {metadata.customUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Custom URL</span>
                      <span className="text-sm text-white">{metadata.customUrl}</span>
                    </div>
                  )}

                  {metadata.country && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Country</span>
                      <span className="text-sm text-white">{metadata.country}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          } catch (e) {
            return null
          }
        })()}

        {/* Contact Information */}
        {coach.metadata && (() => {
          try {
            const metadata = JSON.parse(coach.metadata)
            const hasContactInfo = metadata.contactInfo && (
              metadata.contactInfo.emails?.length > 0 ||
              metadata.contactInfo.phones?.length > 0 ||
              metadata.contactInfo.websites?.length > 0
            )
            
            if (hasContactInfo) {
              return (
                <Card className="bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-white">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metadata.contactInfo.emails && metadata.contactInfo.emails.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Email Addresses</span>
                        <div className="mt-1 space-y-1">
                          {metadata.contactInfo.emails.map((email: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm text-white">📧 {email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {metadata.contactInfo.phones && metadata.contactInfo.phones.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Phone Numbers</span>
                        <div className="mt-1 space-y-1">
                          {metadata.contactInfo.phones.map((phone: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm text-white">📞 {phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {metadata.contactInfo.websites && metadata.contactInfo.websites.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Websites</span>
                        <div className="mt-1 space-y-1">
                          {metadata.contactInfo.websites.map((website: string, index: number) => (
                            <div key={index} className="flex items-center gap-2">
                              <a 
                                href={website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                🌐 {website}
                              </a>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {metadata.contactInfo.isBusiness && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-green-500 text-green-400">
                          🏢 Business Channel
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            }
            return null
          } catch (e) {
            return null
          }
        })()}

        {/* Social Media Links */}
        {coach.metadata && (() => {
          try {
            const metadata = JSON.parse(coach.metadata)
            const socialMedia = metadata.socialMedia || {}
            const hasSocialMedia = Object.keys(socialMedia).length > 0
            
            if (hasSocialMedia) {
              return (
                <Card className="bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-white">Social Media Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(socialMedia).map(([platform, links]: [string, any]) => (
                        <div key={platform} className="space-y-1">
                          <span className="text-sm text-muted-foreground capitalize">{platform}</span>
                          <div className="space-y-1">
                            {Array.isArray(links) && links.slice(0, 2).map((link: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <a 
                                  href={link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline truncate"
                                >
                                  {link}
                                </a>
                                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            }
            return null
          } catch (e) {
            return null
          }
        })()}

        {/* Keywords */}
        {coach.metadata && (() => {
          try {
            const metadata = JSON.parse(coach.metadata)
            if (metadata.keywords && metadata.keywords.length > 0) {
              return (
                <Card className="bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-white">Channel Keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {metadata.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            }
            return null
          } catch (e) {
            return null
          }
        })()}
      </div>

      {coach.videos && coach.videos.length > 0 && (
        <Card className="bg-secondary border-border">
          <CardHeader>
            <CardTitle className="text-white">Processed Videos ({coach.videos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coach.videos.slice(0, 10).map((video: any) => (
                <div key={video.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  {video.thumbnail && (
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-16 h-12 rounded object-cover" 
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{video.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'Unknown duration'}
                      </p>
                      {video.transcript && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                          ✓ Transcript
                        </Badge>
                      )}
                      {video.publishedAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {video.transcript && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Transcript: {video.transcript.length.toLocaleString()} characters
                      </p>
                    )}
                  </div>
                  <a 
                    href={video.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ))}
              {coach.videos.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  And {coach.videos.length - 10} more videos...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Data Summary */}
      {coach.trainingData && (() => {
        try {
          const trainingData = JSON.parse(coach.trainingData)
          return (
            <Card className="bg-secondary border-border">
              <CardHeader>
                <CardTitle className="text-white">Training Data Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Videos Analyzed</span>
                    <span className="text-sm text-white font-semibold">
                      {trainingData.videos?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">System Prompt Length</span>
                    <span className="text-sm text-white font-semibold">
                      {trainingData.systemPrompt?.length || 0} characters
                    </span>
                  </div>
                </div>
                
                {trainingData.videos && trainingData.videos.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Total Transcript Characters</span>
                    <p className="text-sm text-white mt-1">
                      {trainingData.videos.reduce((total: number, video: any) => 
                        total + (video.transcript?.length || 0), 0
                      ).toLocaleString()} characters
                    </p>
                  </div>
                )}

                {trainingData.channelInfo && (
                  <div>
                    <span className="text-sm text-muted-foreground">Channel Information</span>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-white">
                        <strong>Name:</strong> {trainingData.channelInfo.name}
                      </p>
                      <p className="text-sm text-white">
                        <strong>Subscribers:</strong> {trainingData.channelInfo.subscriberCount?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-sm text-white">
                        <strong>Videos:</strong> {trainingData.channelInfo.videoCount?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        } catch (e) {
          return null
        }
      })()}

      <div className="flex items-center gap-3">
        {coach.status === 'READY' && (
          <Link href={`/dashboard/chat/${coach.id}`}>
            <Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff] hover:shadow-lg hover:shadow-[#11e1ff]/25 hover:scale-105 focus:shadow-lg focus:shadow-[#11e1ff]/25 focus:scale-105 transition-all duration-200 ease-in-out">
              <Play className="mr-2 h-4 w-4" />
              Start Chat
            </Button>
          </Link>
        )}
        
        <Button 
          variant="outline" 
          onClick={handleRetrain}
          disabled={isRetraining || coach.status === 'TRAINING'}
          className="border-blue-500/40 text-blue-500 hover:text-white  hover:bg-blue-500/10"
        >
          {isRetraining ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              Retraining...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retrain Coach
            </>
          )}
        </Button>

        {/* Share Buttons */}
        {shareData && (
          <>
            <Button 
              variant="outline" 
              onClick={handleToggleShare}
              disabled={isTogglingShare}
              className={`border-green-500/40 hover:text-white hover:bg-green-500/10 ${
                shareData.isPublic 
                  ? 'text-green-500' 
                  : 'text-gray-500'
              }`}
            >
              <Share2 className="mr-2 h-4 w-4" />
              {shareData.isPublic ? 'Public' : 'Make Public'}
            </Button>

            {shareData.isPublic && (
              <Button 
                variant="outline" 
                onClick={handleCopyShareLink}
                className="border-purple-500/40 text-purple-500 hover:bg-purple-500/10"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            )}
          </>
        )}
        
        <Button 
          variant="outline" 
          className="border-red-500/40 text-red-500 hover:text-white hover:bg-red-500/10"
          onClick={async () => {
            if (confirm('Are you sure you want to delete this coach? This action cannot be undone.')) {
              try {
                const token = localStorage.getItem('auth-token')
                await fetch(`/api/coaches/${coach.id}`, { 
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`
                  }
                })
                window.location.href = '/coaches'
              } catch (error) {
                console.error('Error deleting coach:', error)
              }
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Coach
        </Button>
      </div>
    </div>
  )
}
