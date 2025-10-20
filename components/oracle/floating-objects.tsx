"use client"

import { motion } from "framer-motion"

const items = [
  { x: "8%", y: "10%", size: 10, speed: 6, opacity: 0.8 },
  { x: "22%", y: "30%", size: 14, speed: 4.5, opacity: 0.6 },
  { x: "75%", y: "18%", size: 12, speed: 5.2, opacity: 0.7 },
  { x: "86%", y: "42%", size: 9, speed: 3.2, opacity: 0.75 },
  { x: "15%", y: "58%", size: 11, speed: 5.4, opacity: 0.55 },
  { x: "55%", y: "64%", size: 8, speed: 4.2, opacity: 0.7 },
  { x: "68%", y: "8%", size: 13, speed: 6.4, opacity: 0.6 },
]

export default function FloatingObjects() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {items.map((it, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-primary"
          style={{
            left: it.x,
            top: it.y,
            width: it.size * 4,
            height: it.size * 4,
            opacity: it.opacity,
            filter: "blur(8px)",
          }}
          initial={{ y: 0, scale: 0.9 }}
          animate={{ y: [-6, 6, -6], scale: [0.9, 1.05, 0.9] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: it.speed, ease: "easeInOut" }}
        />
      ))}
      {/* Subtle outlined squares for variety */}
      <motion.span
        className="absolute border border-border/60"
        style={{ left: "68%", top: "62%", width: 34, height: 34, rotate: "14deg" }}
        animate={{ y: [-5, 5, -5] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 7, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute border border-border/60"
        style={{ left: "28%", top: "14%", width: 24, height: 24, rotate: "-10deg" }}
        animate={{ y: [5, -5, 5] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 6, ease: "easeInOut" }}
      />
    </div>
  )
}
