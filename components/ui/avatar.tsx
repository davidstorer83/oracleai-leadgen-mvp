"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm", 
  lg: "w-10 h-10 text-base",
  xl: "w-12 h-12 text-lg"
}

export function Avatar({ src, alt, fallback, className, size = "md" }: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const getInitials = (name: string) => {
    if (!name) return "?"
    
    const words = name.trim().split(/\s+/)
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  const initials = getInitials(fallback || alt || "")

  return (
    <div className={cn(
      "relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border border-primary/30 overflow-hidden",
      sizeClasses[size],
      className
    )}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-semibold text-primary">
          {initials}
        </span>
      )}
    </div>
  )
}
