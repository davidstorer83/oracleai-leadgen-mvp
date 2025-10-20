"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import FloatingObjects from "./floating-objects"

export default function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-20 md:pt-28">
      {/* Subtle grid background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-overlay" />
        {/* Cyan ambient glows using tokens */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      {/* Floating decorative objects */}
      <FloatingObjects />

      <div className="text-center">
        <motion.h1
          className="text-4xl md:text-5xl font-semibold text-white text-balance tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Turn your YouTube channel into an AI Coach
        </motion.h1>

        <motion.p
          className="mt-4 text-muted-foreground max-w-2xl mx-auto text-pretty"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          OracleAI learns your content, voice, and tone to deliver personalized coaching experiences for your
          audience—24/7.
        </motion.p>

        <motion.div
          className="mt-6 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Link href="/dashboard">
            <Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff] glow-pulse">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#features" className="text-sm text-muted-foreground hover:text-white transition-colors">
            See features
          </a>
        </motion.div>

        {/* Kinetic sub-bar */}
        <motion.div
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          Built for creators, coaches, and educators
        </motion.div>
      </div>
    </section>
  )
}
