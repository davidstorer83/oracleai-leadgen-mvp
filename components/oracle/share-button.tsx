"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

interface ShareButtonProps {
  shareUrl: string
}

export function ShareButton({ shareUrl }: ShareButtonProps) {
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <Button 
      variant="outline" 
      className="w-full border-gray-300 hover:bg-gray-50 text-white font-medium py-3 mt-2"
      onClick={handleShare}
    >
      <Share2 className="w-5 h-5 mr-2" />
      Share Coach
    </Button>
  )
}