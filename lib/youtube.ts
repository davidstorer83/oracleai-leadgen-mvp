import axios from 'axios'
import { YoutubeTranscript } from 'youtube-transcript'
import { Innertube } from 'youtubei.js'

export interface YouTubeChannelInfo {
  id: string
  title: string
  description: string
  thumbnail: string
  subscriberCount: number
  videoCount: number
  totalViews: number
  joinedDate: string
  location: string
  isMonetized: boolean
  verified?: boolean
  keywords?: string[]
  socialLinks?: string[]
  customUrl?: string
  country?: string
  // Additional extracted information
  website?: string[]
  email?: string[]
  phone?: string[]
  socialMedia?: any
  businessInfo?: any
}

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnail: string
  duration: string
  publishedAt: string
  viewCount: string
  url: string
  verified?: string
  tags?: string[]
  categoryId?: string
}

export interface YouTubeDataSummary {
  channelInfo: YouTubeChannelInfo
  videos: YouTubeVideo[]
  totalVideosProcessed: number
  totalTranscriptsExtracted: number
  totalCharactersInTranscripts: number
  averageVideoLength: string
  channelAge: string
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

// Extract channel ID from various YouTube URL formats
export function extractChannelId(url: string): string | null {
  // Handle different YouTube URL formats
  const patterns = [
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/([a-zA-Z0-9_-]+)/, // Handle vanity URLs
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }
  return null
}

// Get channel ID from username or custom URL
async function getChannelIdFromUsername(username: string): Promise<string | null> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'id',
        forUsername: username,
        key: process.env.YOUTUBE_API_KEY,
      },
    })

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id
    }
    return null
  } catch (error) {
    return null
  }
}

// Get channel ID from custom URL
async function getChannelIdFromCustomUrl(customUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'id',
        forHandle: customUrl,
        key: process.env.YOUTUBE_API_KEY,
      },
    })

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id
    }
    return null
  } catch (error) {
    return null
  }
}

// Resolve channel ID from URL
async function resolveChannelId(url: string): Promise<string | null> {
  const extractedId = extractChannelId(url)
  if (!extractedId) return null

  // If it's already a channel ID (starts with UC), return it
  if (extractedId.startsWith('UC')) {
    return extractedId
  }

  // If it's a username (starts with @), remove @ and get channel ID
  if (extractedId.startsWith('@')) {
    const username = extractedId.substring(1)
    return await getChannelIdFromUsername(username)
  }

  // If it's a custom URL, try to get channel ID
  return await getChannelIdFromCustomUrl(extractedId)
}

// Get comprehensive channel information
export async function getChannelInfo(channelUrl: string): Promise<YouTubeChannelInfo | null> {
  try {
    const channelId = await resolveChannelId(channelUrl)
    if (!channelId) {
      throw new Error('Could not resolve channel ID from URL')
    }

    // Get channel details with all available parts
    const channelResponse = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'snippet,statistics,brandingSettings,status,contentDetails',
        id: channelId,
        key: process.env.YOUTUBE_API_KEY,
      },
    })

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('Channel not found')
    }

    const channel = channelResponse.data.items[0]
    const snippet = channel.snippet
    const statistics = channel.statistics
    const brandingSettings = channel.brandingSettings
    const status = channel.status
    

    // Get channel's uploads playlist to count videos
    const uploadsResponse = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: process.env.YOUTUBE_API_KEY,
      },
    })

    const uploadsPlaylistId = uploadsResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    // Extract all available links and contact information
    const extractedLinks = extractAllLinks(snippet.description || '', brandingSettings)

    return {
      id: channelId,
      title: snippet.title,
      description: snippet.description,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      subscriberCount: parseInt(statistics.subscriberCount || '0'),
      videoCount: parseInt(statistics.videoCount || '0'),
      totalViews: parseInt(statistics.viewCount || '0'),
      joinedDate: snippet.publishedAt,
      location: snippet.country || '',
      isMonetized: status?.isLinked || false,
      verified: status?.isLinked || false,
      keywords: snippet.tags || [],
      socialLinks: extractedLinks.allLinks,
      customUrl: snippet.customUrl || '',
      country: snippet.country || '',
      // Additional extracted information
      website: extractedLinks.website,
      email: extractedLinks.email,
      phone: extractedLinks.phone,
      socialMedia: extractedLinks.socialMedia,
      businessInfo: extractedLinks.businessInfo,
    }
  } catch (error) {
    throw new Error(`Failed to fetch channel info: ${error}`)
  }
}

// Get channel videos with pagination
export async function getChannelVideos(channelUrl: string, maxVideos: number = 50): Promise<YouTubeVideo[]> {
  try {
    const channelId = await resolveChannelId(channelUrl)
    if (!channelId) {
      throw new Error('Could not resolve channel ID from URL')
    }

    // Get uploads playlist ID
    const channelResponse = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: 'contentDetails',
        id: channelId,
        key: process.env.YOUTUBE_API_KEY,
      },
    })

    const uploadsPlaylistId = channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) {
      throw new Error('Could not find uploads playlist')
    }

    // Get videos from uploads playlist
    const videos: YouTubeVideo[] = []
    let nextPageToken = ''
    let totalFetched = 0

    while (totalFetched < maxVideos && (nextPageToken || totalFetched === 0)) {
      const playlistResponse = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
        params: {
          part: 'snippet,contentDetails',
          playlistId: uploadsPlaylistId,
          maxResults: Math.min(50, maxVideos - totalFetched),
          pageToken: nextPageToken || undefined,
          key: process.env.YOUTUBE_API_KEY,
        },
      })

      const videoIds = playlistResponse.data.items.map((item: any) => item.contentDetails.videoId)
      
      if (videoIds.length === 0) break

      // Get detailed video information
      const videosResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
        params: {
          part: 'snippet,statistics,contentDetails',
          id: videoIds.join(','),
          key: process.env.YOUTUBE_API_KEY,
        },
      })

      for (const video of videosResponse.data.items) {
        if (totalFetched >= maxVideos) break
        
        videos.push({
          id: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url || '',
          duration: formatDuration(video.contentDetails.duration),
          publishedAt: video.snippet.publishedAt,
          viewCount: parseInt(video.statistics.viewCount || '0').toLocaleString() + ' views',
          url: `https://www.youtube.com/watch?v=${video.id}`,
          tags: video.snippet.tags || [],
          categoryId: video.snippet.categoryId,
        })

        totalFetched++
      }

      nextPageToken = playlistResponse.data.nextPageToken || ''
    }

    return videos
  } catch (error) {
    throw new Error(`Failed to fetch channel videos: ${error}`)
  }
}

export async function getVideoTranscript(videoId: string): Promise<string | null> {
  const languages = ['en', 'en-US', 'en-GB', 'auto']
  
  for (const lang of languages) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang })
      if (transcript && transcript.length > 0) {
        return transcript.map(item => item.text).join(' ')
      }
    } catch (error) {
      // Continue to next language
    }
  }
  
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    if (transcript && transcript.length > 0) {
      return transcript.map(item => item.text).join(' ')
    }
  } catch (error) {
    // Continue to next strategy
  }
  
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
    if (transcript && transcript.length > 0) {
      return transcript.map(item => item.text).join(' ')
    }
  } catch (error) {
    // All strategies failed
  }
  
  return null
}

// Check if video has transcripts available
export async function checkTranscriptAvailability(videoId: string): Promise<boolean> {
  try {
    // Try to get transcript list without actually fetching the content
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
    return transcript && transcript.length > 0
  } catch (error) {
    return false
  }
}

export async function getVideoTranscriptAlternative(videoId: string): Promise<string | null> {
  try {
    const yt = await Innertube.create()
    const video = await yt.getInfo(videoId)
    
    if (video.captions) {
      const captionTracks = video.captions.caption_tracks
      if (captionTracks && captionTracks.length > 0) {
        let selectedTrack = captionTracks.find(track => 
          track.language_code === 'en' || 
          track.language_code === 'en-US' ||
          track.language_code === 'en-GB'
        )
        
        if (!selectedTrack) {
          selectedTrack = captionTracks[0]
        }
        
        if (selectedTrack) {
          const captionResponse = await axios.get(selectedTrack.base_url)
          const captionData = captionResponse.data
          
          if (captionData && typeof captionData === 'string') {
            const textMatches = captionData.match(/<text[^>]*>([^<]*)<\/text>/g)
            if (textMatches) {
              return textMatches
                .map(match => match.replace(/<[^>]*>/g, ''))
                .join(' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
            }
          }
        }
      }
    }
    
    return null
  } catch (error) {
    return null
  }
}

export async function getVideoTranscriptTactiq(videoId: string): Promise<string | null> {
  try {
    const videoUrl = videoId.length === 11 
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://www.youtube.com/shorts/${videoId}`
    
    const response = await axios.post('https://tactiq-apps-prod.tactiq.io/transcript', {
      videoUrl: videoUrl,
      langCode: 'en'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000
    })
    
    if (response.data && response.data.captions && response.data.captions.length > 0) {
      return response.data.captions
        .map((caption: any) => caption.text)
        .join(' ')
        .trim()
    }
    
    return null
  } catch (error) {
    return null
  }
}


export async function getVideoTranscriptWithRetry(videoId: string, maxRetries: number = 3): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const tactiqTranscript = await getVideoTranscriptTactiq(videoId)
      if (tactiqTranscript) {
        return tactiqTranscript
      }
    } catch (error) {
      // Continue to next attempt
    }
    
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  return null
}

// Format ISO 8601 duration to readable format
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return '0:00'

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

// Calculate channel age
function calculateChannelAge(joinedDate: string): string {
  const joined = new Date(joinedDate)
  const now = new Date()
  const diffInMs = now.getTime() - joined.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays < 30) {
    return `${diffInDays} days`
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months} month${months > 1 ? 's' : ''}`
  } else {
    const years = Math.floor(diffInDays / 365)
    const remainingMonths = Math.floor((diffInDays % 365) / 30)
    return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`
  }
}

// Calculate average video length
function calculateAverageVideoLength(videos: YouTubeVideo[]): string {
  if (videos.length === 0) return '0:00'

  const totalSeconds = videos.reduce((total, video) => {
    const duration = video.duration
    const parts = duration.split(':').map(Number)
    
    if (parts.length === 3) { // HH:MM:SS
      return total + parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) { // MM:SS
      return total + parts[0] * 60 + parts[1]
    }
    return total
  }, 0)

  const averageSeconds = Math.floor(totalSeconds / videos.length)
  const hours = Math.floor(averageSeconds / 3600)
  const minutes = Math.floor((averageSeconds % 3600) / 60)
  const seconds = averageSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}

// Main function to get comprehensive YouTube data
export async function getYouTubeChannelData(channelUrl: string, maxVideos: number = 50): Promise<YouTubeDataSummary> {
  try {
    const channelInfo = await getChannelInfo(channelUrl)
    if (!channelInfo) {
      throw new Error('Failed to fetch channel information')
    }

    const videos = await getChannelVideos(channelUrl, maxVideos)
    const videosWithTranscripts = []
    const maxTranscripts = Math.min(15, videos.length)
    
    for (let i = 0; i < maxTranscripts; i++) {
      const video = videos[i]
      const transcript = await getVideoTranscriptWithRetry(video.id, 2)
      if (transcript) {
        videosWithTranscripts.push({ ...video, transcript })
      }
      
      if (i < maxTranscripts - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    const totalTranscriptsExtracted = videosWithTranscripts.length
    const totalCharactersInTranscripts = videosWithTranscripts.reduce((total, video) => {
      return total + (video.transcript?.length || 0)
    }, 0)

    const averageVideoLength = calculateAverageVideoLength(videos)
    const channelAge = calculateChannelAge(channelInfo.joinedDate)

    return {
      channelInfo,
      videos: videosWithTranscripts,
      totalVideosProcessed: videos.length,
      totalTranscriptsExtracted,
      totalCharactersInTranscripts,
      averageVideoLength,
      channelAge,
    }
  } catch (error) {
    throw new Error(`Failed to fetch YouTube channel data: ${error}`)
  }
}

// Comprehensive link extraction function
function extractAllLinks(description: string, brandingSettings: any): any {
  const result = {
    allLinks: [] as string[],
    website: [] as string[],
    email: [] as string[],
    phone: [] as string[],
    socialMedia: {} as any,
    businessInfo: {} as any
  }
  
  // Combine description with branding settings
  let combinedText = description
  
  // Extract from branding settings
  if (brandingSettings) {
    if (brandingSettings.channel?.unsubscribedTrailer) {
      combinedText += ` ${brandingSettings.channel.unsubscribedTrailer}`
    }
    if (brandingSettings.channel?.keywords) {
      combinedText += ` ${brandingSettings.channel.keywords}`
    }
    if (brandingSettings.channel?.defaultTab) {
      combinedText += ` ${brandingSettings.channel.defaultTab}`
    }
  }
  
  // Extract email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const emails = combinedText.match(emailRegex)
  if (emails) {
    result.email = [...new Set(emails)]
    result.allLinks.push(...result.email)
  }
  
  // Extract phone numbers
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
  const phones = combinedText.match(phoneRegex)
  if (phones) {
    result.phone = [...new Set(phones)]
    result.allLinks.push(...result.phone)
  }
  
  // Extract website URLs (excluding social media)
  const websiteRegex = /(https?:\/\/[^\s]+)/g
  const allUrls = combinedText.match(websiteRegex) || []
  
  // Filter out social media URLs
  const socialMediaDomains = [
    'instagram.com', 'twitter.com', 'x.com', 'facebook.com', 'linkedin.com',
    'tiktok.com', 'youtube.com', 'discord.gg', 'discord.com', 't.me',
    'snapchat.com', 'twitch.tv', 'pinterest.com', 'reddit.com'
  ]
  
  const websites = allUrls.filter(url => {
    try {
      const domain = new URL(url).hostname.toLowerCase()
      return !socialMediaDomains.some(socialDomain => domain.includes(socialDomain))
    } catch {
      return false
    }
  })
  
  if (websites.length > 0) {
    result.website = [...new Set(websites)]
    result.allLinks.push(...result.website)
  }
  
  // Extract social media links
  result.socialMedia = extractSocialMediaLinks(description, allUrls)
  
  // Add social media links to allLinks
  Object.values(result.socialMedia).forEach((links: any) => {
    if (Array.isArray(links)) {
      result.allLinks.push(...links)
    }
  })
  
  // Extract business information
  const businessKeywords = ['business', 'company', 'corporate', 'enterprise', 'brand', 'store', 'shop', 'official']
  const hasBusinessKeywords = businessKeywords.some(keyword => 
    combinedText.toLowerCase().includes(keyword)
  )
  
  result.businessInfo = {
    isBusiness: hasBusinessKeywords,
    keywords: businessKeywords.filter(keyword => 
      combinedText.toLowerCase().includes(keyword)
    )
  }
  
  // Remove duplicates from allLinks
  result.allLinks = [...new Set(result.allLinks)]
  
  
  return result
}

// Extract social media links from description and social links
function extractSocialMediaLinks(description: string, socialLinks: string[] = []): any {
  const socialMedia: any = {}
  
  // Combine description and social links for analysis
  const combinedText = `${description} ${socialLinks.join(' ')}`
  
  // Extract social media platforms
  const platforms = {
    instagram: /instagram\.com\/([a-zA-Z0-9._]+)/gi,
    twitter: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9._]+)/gi,
    facebook: /facebook\.com\/([a-zA-Z0-9._]+)/gi,
    linkedin: /linkedin\.com\/(?:in\/|company\/)([a-zA-Z0-9._-]+)/gi,
    tiktok: /tiktok\.com\/@([a-zA-Z0-9._]+)/gi,
    youtube: /youtube\.com\/(?:c\/|channel\/|@)([a-zA-Z0-9._-]+)/gi,
    discord: /discord\.(?:gg|com)\/([a-zA-Z0-9._-]+)/gi,
    telegram: /t\.me\/([a-zA-Z0-9._]+)/gi,
    snapchat: /snapchat\.com\/add\/([a-zA-Z0-9._]+)/gi,
    twitch: /twitch\.tv\/([a-zA-Z0-9._]+)/gi
  }
  
  for (const [platform, regex] of Object.entries(platforms)) {
    const matches = combinedText.match(regex)
    if (matches) {
      socialMedia[platform] = [...new Set(matches)]
    }
  }
  
  return socialMedia
}