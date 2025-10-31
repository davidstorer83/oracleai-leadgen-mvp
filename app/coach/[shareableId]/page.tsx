import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { ShareButton } from '@/components/oracle/share-button'
import { LoadingSpinner } from '@/components/oracle/loading-spinner'
import { MessageCircle, ExternalLink, Users, Video, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { getBaseUrl } from '@/lib/utils'

interface PublicCoachPageProps {
  params: Promise<{
    shareableId: string
  }>
}

async function CoachContent({ shareableId }: { shareableId: string }) {
  try {
    // Validate shareableId
    if (!shareableId || shareableId.trim() === '') {
      notFound()
    }

    // Find coach by shareableId (findUnique only works with unique fields)
    let coach = await prisma.coach.findUnique({
      where: { 
        shareableId: shareableId.trim()
      },
      include: {
        videos: {
          take: 6,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Fallback: Try findFirst if findUnique returns null (edge case handling)
    if (!coach) {
      coach = await prisma.coach.findFirst({
        where: { 
          shareableId: shareableId.trim()
        },
        include: {
          videos: {
            take: 6,
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    }

    if (!coach) {
      notFound()
    }

    // Temporarily allow viewing even if not public (for testing)
    // TODO: Remove this in production and enforce isPublic check
    if (!coach.isPublic) {
      // Uncomment the line below to enforce public-only access:
      // notFound()
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

  // Get base URL from headers
  const headersList = await headers()
  const baseUrl = getBaseUrl({ headers: headersList })
  const shareUrl = `${baseUrl}/coach/${shareableId}`
  const chatUrl = `/coach/${shareableId}/chat`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hey there! I'm {coach.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            I'm here to chat and help you with questions about my expertise and experiences
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coach Info Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 border border-gray-200 shadow-xl bg-white">
              <CardHeader className="text-center bg-white border-b border-gray-100">
                <div className="flex justify-center mb-4">
                  <Avatar 
                    src={coach.avatar || ''} 
                    alt={coach.name} 
                    fallback={coach.name}
                    className="w-24 h-24 border-4 border-white shadow-xl"
                    size="xl"
                  />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">{coach.name}</CardTitle>
                <CardDescription className="text-lg text-gray-600 font-medium">
                  {coach.channelName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Channel Stats */}
                {metadata.subscriberCount && (
                  <div className="flex items-center gap-3 text-sm text-gray-800 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{metadata.subscriberCount.toLocaleString()} subscribers</span>
                  </div>
                )}
                
                {metadata.videoCount && (
                  <div className="flex items-center gap-3 text-sm text-gray-800 bg-green-50 px-4 py-3 rounded-lg border border-green-100">
                    <Video className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-900">{metadata.videoCount} videos</span>
                  </div>
                )}

                {coach.createdAt && (
                  <div className="flex items-center gap-3 text-sm text-gray-800 bg-purple-50 px-4 py-3 rounded-lg border border-purple-100">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">Trained {new Date(coach.createdAt).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Description */}
                {coach.description && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">About</h4>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                      {coach.description}
                    </p>
                  </div>
                )}

                {/* Keywords */}
                {metadata.keywords && metadata.keywords.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {metadata.keywords.slice(0, 8).map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border border-blue-200 font-medium px-2 py-1">
                          {keyword.replace(/"/g, '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link href={chatUrl} className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200" size="lg">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Start Chatting (No Signup Required)
                    </Button>
                  </Link>
                  
                  <ShareButton shareUrl={shareUrl} />

                  {coach.channelUrl && (
                    <Button 
                      variant="outline" 
                      className="w-full border-gray-300 hover:bg-gray-50 text-white font-medium py-3 hover:border-gray-400 transition-all duration-200"
                      asChild
                    >
                      <a href={coach.channelUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-5 h-5 mr-2" />
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
            <Card className="border border-gray-200 shadow-xl bg-white">
              <CardHeader className="bg-white border-b border-gray-100">
                <CardTitle className="text-xl font-bold text-gray-900">About Me</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-800 leading-relaxed text-base">
                  {coach.description || `I'm ${coach.name}, and I'm passionate about sharing my knowledge and experiences with you. I love talking about my expertise and helping people grow through meaningful conversations.`}
                </p>
                
                {coach.tone && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>My style:</strong> {coach.tone}
                  </p>
                </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            {metadata && metadata.contactInfo && (
              metadata.contactInfo.emails?.length > 0 ||
              metadata.contactInfo.phones?.length > 0 ||
              metadata.contactInfo.websites?.length > 0
            ) && (
              <Card className="border border-gray-200 shadow-xl bg-white">
                <CardHeader className="bg-white border-b border-gray-100">
                  <CardTitle className="text-xl font-bold text-gray-900">Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {metadata.contactInfo.emails && metadata.contactInfo.emails.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Email Me</h4>
                      <div className="space-y-2">
                        {metadata.contactInfo.emails.map((email: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">📧 {email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {metadata.contactInfo.phones && metadata.contactInfo.phones.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Call Me</h4>
                      <div className="space-y-2">
                        {metadata.contactInfo.phones.map((phone: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">📞 {phone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {metadata.contactInfo.websites && metadata.contactInfo.websites.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Visit My Websites</h4>
                      <div className="space-y-2">
                        {metadata.contactInfo.websites.map((website: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                            <a 
                              href={website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              🌐 {website}
                            </a>
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {metadata.contactInfo.isBusiness && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-green-500 text-green-600">
                        🏢 Business Channel
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social Media Links */}
            {metadata && metadata.socialMedia && Object.keys(metadata.socialMedia).length > 0 && (
              <Card className="border border-gray-200 shadow-xl bg-white">
                <CardHeader className="bg-white border-b border-gray-100">
                  <CardTitle className="text-xl font-bold text-gray-900">Follow Me</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(metadata.socialMedia).map(([platform, links]: [string, any]) => (
                      <div key={platform} className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900 capitalize">{platform}</h4>
                        <div className="space-y-1">
                          {Array.isArray(links) && links.slice(0, 3).map((link: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <a 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline truncate"
                              >
                                {link}
                              </a>
                              <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Keywords */}
            {metadata && metadata.keywords && metadata.keywords.length > 0 && (
              <Card className="border border-gray-200 shadow-xl bg-white">
                <CardHeader className="bg-white border-b border-gray-100">
                  <CardTitle className="text-xl font-bold text-gray-900">What I Talk About</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    {metadata.keywords.map((keyword: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-800 border border-blue-200 font-medium px-3 py-1">
                        {keyword.replace(/"/g, '')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Content */}
            {coach.videos.length > 0 && (
              <Card className="border border-gray-200 shadow-xl bg-white">
                <CardHeader className="bg-white border-b border-gray-100">
                  <CardTitle className="text-xl font-bold text-gray-900">My Content</CardTitle>
                  <CardDescription className="text-gray-600 font-medium">
                    Some of the videos I've created that you can learn from
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coach.videos.map((video) => (
                      <div key={video.id} className="flex gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-md">
                        {video.thumbnail && (
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-16 h-12 object-cover rounded border border-gray-200"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate leading-tight">
                            {video.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                          {video.duration && (
                              <p className="text-xs text-gray-600 font-medium">
                              {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                            {video.transcript && (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                                ✓ Available
                              </Badge>
                            )}
                          </div>
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
  } catch (error) {
    notFound()
  }
}

export default async function PublicCoachPage({ params }: PublicCoachPageProps) {
  const { shareableId } = await params

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CoachContent shareableId={shareableId} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: PublicCoachPageProps) {
  const { shareableId } = await params

  const coach = await prisma.coach.findUnique({
    where: { 
      shareableId
    }
  })

  // Check if coach exists and is public
  if (!coach || !coach.isPublic) {
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
