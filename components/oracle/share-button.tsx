'use client'

import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { useState } from 'react'

interface ShareButtonProps {
  shareUrl: string
}

export function ShareButton({ shareUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <Button 
      variant="outline" 
      className="w-full"
      onClick={handleShare}
    >
      <Share2 className="w-4 h-4 mr-2" />
      {copied ? 'Copied!' : 'Share Coach'}
    </Button>
  )
}
