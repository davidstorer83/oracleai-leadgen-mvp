import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Share2, MessageCircle, ExternalLink, Users, Video, Calendar } from 'lucide-react'
import Link from 'next/link'

interface PublicCoachPageProps {
  params: Promise<{
    shareableId: string
  }>
}

export default async function PublicCoachPage({ params }: PublicCoachPageProps) {
  const { shareableId } = await params

  // Find coach by shareableId
  const coach = await prisma.coach.findUnique({
    where: { 
      shareableId,
      isPublic: true // Only show public coaches
    },
    include: {
      videos: {
        take: 6,
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!coach) {
    notFound()
  }

  // Parse metadata
  let metadata = {}
  try {
    if (coach.metadata) {
      metadata = JSON.parse(coach.metadata)
    }
  } catch (e) {
    // Ignore parsing errors
  }

  const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/coach/${shareableId}`
  const chatUrl = `/dashboard/chat/${coach.id}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Chat with {coach.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            An AI-powered version of {coach.channelName || coach.name} trained on their content
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coach Info Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar 
                    src={coach.avatar || ''} 
                    alt={coach.name} 
                    fallback={coach.name}
                    className="w-24 h-24"
                    size="xl"
                  />
                </div>
                <CardTitle className="text-2xl">{coach.name}</CardTitle>
                <CardDescription className="text-lg">
                  {coach.channelName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Channel Stats */}
                {metadata.subscriberCount && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{metadata.subscriberCount.toLocaleString()} subscribers</span>
                  </div>
                )}
                
                {metadata.videoCount && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Video className="w-4 h-4" />
                    <span>{metadata.videoCount} videos</span>
                  </div>
                )}

                {coach.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Trained {new Date(coach.createdAt).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Description */}
                {coach.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {coach.description}
                    </p>
                  </div>
                )}

                {/* Keywords */}
                {metadata.keywords && metadata.keywords.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Topics</h4>
                    <div className="flex flex-wrap gap-1">
                      {metadata.keywords.slice(0, 8).map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword.replace(/"/g, '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t space-y-3">
                  <Link href={chatUrl} className="w-full">
                    <Button className="w-full" size="lg">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Start Chatting
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl)
                      // You could add a toast notification here
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Coach
                  </Button>

                  {coach.channelUrl && (
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      asChild
                    >
                      <a href={coach.channelUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Original Channel
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About This AI Coach</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  This AI coach has been trained on {coach.videos.length} videos from {coach.channelName || coach.name}'s 
                  YouTube channel. It can answer questions, provide insights, and have conversations 
                  in the style and knowledge of the original creator.
                </p>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This is an AI-powered version for educational and entertainment purposes. 
                    It's not affiliated with or endorsed by the original creator.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Videos */}
            {coach.videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Training Content</CardTitle>
                  <CardDescription>
                    This AI has been trained on the following videos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coach.videos.map((video) => (
                      <div key={video.id} className="flex gap-3 p-3 border rounded-lg">
                        {video.thumbnail && (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {video.title}
                          </h4>
                          {video.duration && (
                            <p className="text-xs text-gray-500">
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PublicCoachPageProps) {
  const { shareableId } = await params

  const coach = await prisma.coach.findUnique({
    where: { 
      shareableId,
      isPublic: true
    }
  })

  if (!coach) {
    return {
      title: 'Coach Not Found',
    }
  }

  return {
    title: `Chat with ${coach.name} - AI Coach`,
    description: `Chat with an AI-powered version of ${coach.channelName || coach.name} trained on their YouTube content.`,
    openGraph: {
      title: `Chat with ${coach.name}`,
      description: `AI-powered version of ${coach.channelName || coach.name}`,
      images: coach.avatar ? [coach.avatar] : [],
    },
  }
}
