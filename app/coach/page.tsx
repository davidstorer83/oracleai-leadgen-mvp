import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { MessageCircle, Users, Video, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function PublicCoachesPage() {
  // Get all public coaches
  const publicCoaches = await prisma.coach.findMany({
    where: {
      isPublic: true,
      status: 'READY' // Only show ready coaches
    },
    include: {
      videos: {
        take: 3,
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 12 // Limit to 12 coaches
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Coaches
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chat with AI-powered versions of your favorite YouTube creators, 
            trained on their content and speaking style.
          </p>
        </div>

        {/* Coaches Grid */}
        {publicCoaches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicCoaches.map((coach) => {
              // Parse metadata
              let metadata = {}
              try {
                if (coach.metadata) {
                  metadata = JSON.parse(coach.metadata)
                }
              } catch (e) {
                // Ignore parsing errors
              }

              return (
                <Card key={coach.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar 
                        src={coach.avatar || ''} 
                        alt={coach.name} 
                        fallback={coach.name}
                        className="w-16 h-16"
                        size="xl"
                      />
                    </div>
                    <CardTitle className="text-xl">{coach.name}</CardTitle>
                    <CardDescription className="text-base">
                      {coach.channelName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="flex justify-center gap-4 text-sm text-gray-600">
                      {metadata.subscriberCount && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{(metadata.subscriberCount / 1000000).toFixed(1)}M</span>
                        </div>
                      )}
                      {coach.videos.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          <span>{coach.videos.length}+ videos</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {coach.description && (
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {coach.description}
                      </p>
                    )}

                    {/* Keywords */}
                    {metadata.keywords && metadata.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {metadata.keywords.slice(0, 3).map((keyword: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword.replace(/"/g, '')}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Link href={`/coach/${coach.shareableId}`} className="w-full">
                        <Button className="w-full" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat with {coach.name}
                        </Button>
                      </Link>
                      
                      {coach.channelUrl && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <a href={coach.channelUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Original Channel
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Public Coaches Yet
            </h2>
            <p className="text-gray-600 mb-8">
              Be the first to create and share an AI coach!
            </p>
            <Link href="/signup">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            These AI coaches are created by users and trained on publicly available content.
            They are for educational and entertainment purposes only.
          </p>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'AI Coaches - Chat with Your Favorite Creators',
  description: 'Chat with AI-powered versions of YouTube creators, trained on their content and speaking style.',
  openGraph: {
    title: 'AI Coaches - Chat with Your Favorite Creators',
    description: 'Chat with AI-powered versions of YouTube creators, trained on their content and speaking style.',
  },
}
