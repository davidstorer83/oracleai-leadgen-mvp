"use client"

import type React from "react"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type Shape = {
  size: number
  className?: string
  style?: React.CSSProperties
  delay?: number
  duration?: number
  variant?: "circle" | "diamond" | "pill"
}

function ShapeBlob({ size, className, style, delay = 0, duration = 8, variant = "circle" }: Shape) {
  const base = "absolute motion-float will-change-transform opacity-70"
  const shared = "bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/25 backdrop-blur-[2px]"
  const radius =
    variant === "circle" ? "rounded-full" : variant === "diamond" ? "rotate-45 rounded-[8px]" : "rounded-full" // pill handled by aspect

  const dims = variant === "pill" ? `h-[${size}px] w-[${Math.round(size * 2)}px]` : `h-[${size}px] w-[${size}px]`

  return (
    <motion.div
      className={cn(base, shared, radius, dims, className)}
      style={style}
      initial={{ y: 0, scale: 0.95 }}
      animate={{ y: -10, scale: 1 }}
      transition={{ delay, duration, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", ease: "easeInOut" }}
    />
  )
}

export function FloatingShapes({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <ShapeBlob size={80} variant="circle" style={{ top: "10%", left: "8%" }} delay={0} />
      <ShapeBlob size={56} variant="diamond" style={{ top: "22%", right: "12%" }} delay={0.6} duration={7.5} />
      <ShapeBlob size={48} variant="pill" style={{ bottom: "18%", left: "18%" }} delay={0.2} duration={6.5} />
      <ShapeBlob size={64} variant="circle" style={{ bottom: "8%", right: "8%" }} delay={0.8} duration={7.8} />
    </div>
  )
}
