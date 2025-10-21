import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { MessageCircle, ExternalLink, Users, Video, Calendar } from 'lucide-react'
import Link from 'next/link'
import { ShareButton } from '@/components/oracle/share-button'

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
  let metadata: any = {}
  try {
    if (coach.metadata) {
      metadata = JSON.parse(coach.metadata)
    }
  } catch (e) {
    // Ignore parsing errors
  }

  const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/coach/${shareableId}`
  const chatUrl = `/coach/${shareableId}/chat`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-sm border">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">AI Coach Available</span>
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Chat with {coach.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Chat directly with <span className="font-semibold text-blue-600">{coach.name}</span> and get personalized insights from their expertise. 
            <br />
            <span className="text-green-600 font-medium">No login required - start chatting instantly!</span>
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coach Info Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="relative flex justify-center mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-20"></div>
                  <Avatar 
                    src={coach.avatar || ''} 
                    alt={coach.name} 
                    fallback={coach.name}
                    className="w-28 h-28 relative z-10 ring-4 ring-white shadow-lg"
                    size="xl"
                  />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">{coach.name}</CardTitle>
                <CardDescription className="text-lg text-gray-600 font-medium">
                  {coach.channelName}
                </CardDescription>
                <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  AI Coach Online
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Channel Stats */}
                <div className="grid grid-cols-1 gap-3">
                  {metadata.subscriberCount && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Subscribers</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{metadata.subscriberCount.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {metadata.videoCount && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Videos</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{metadata.videoCount}</span>
                    </div>
                  )}

                  {coach.createdAt && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Trained</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{new Date(coach.createdAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

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
                <div className="pt-6 border-t space-y-4">
                  <Link href={chatUrl} className="w-full">
                    <Button className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Start Chatting (No Login Required)
                    </Button>
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <ShareButton shareUrl={shareUrl} />

                    {coach.channelUrl && (
                      <Button 
                        variant="outline" 
                        className="w-full h-10 border-gray-300 hover:border-gray-400"
                        asChild
                      >
                        <a href={coach.channelUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Original Channel
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  About {coach.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-gray-700 leading-relaxed text-lg">
                  Chat directly with <span className="font-semibold">{coach.name}</span> and get personalized insights from their expertise. 
                  Based on <span className="font-semibold text-blue-600">{coach.videos.length} videos</span> from their YouTube channel, 
                  you can ask questions and get authentic responses in their style and knowledge.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-semibold text-green-800">Free to Use</span>
                    </div>
                    <p className="text-sm text-green-700">
                      No registration required! Simply click "Start Chatting" to begin your conversation with this AI coach.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-semibold text-blue-800">Educational Purpose</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      This is an AI-powered version for educational and entertainment purposes. 
                      It's not affiliated with or endorsed by the original creator.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Videos */}
            {coach.videos.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Training Content
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    This AI has been trained on the following videos from the original channel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coach.videos.map((video, index) => (
                      <div key={video.id} className="flex gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        {video.thumbnail && (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-20 h-14 object-cover rounded-lg shadow-sm"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                              Video {index + 1}
                            </span>
                            {video.duration && (
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                            {video.title}
                          </h4>
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
