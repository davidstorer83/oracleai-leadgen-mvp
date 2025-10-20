"use client"

import { motion } from "framer-motion"
import { FloatingShapes } from "./shapes"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function HeroAnimated() {
  return (
    <section className="relative overflow-hidden">
      {/* Atmospheric backdrop */}
      <div className="absolute inset-0 grid-backdrop" />
      {/* Soft cyan ring */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <div
          className={cn(
            "motion-rotate-slow",
            "h-[66rem] w-[66rem] rounded-full",
            "bg-[radial-gradient(closest-side,rgba(0,217,255,0.12),transparent_60%)]",
          )}
        />
      </div>
      {/* Animated glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-[color:var(--accent)]/25 blur-3xl motion-glow" />

      <FloatingShapes />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-28 text-center md:pt-36">
        <motion.span
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--muted)] px-3 py-1 text-xs text-[color:var(--muted-foreground)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          New • AI Coach Platform for YouTube
        </motion.span>

        <motion.h1
          className="text-balance mt-5 max-w-3xl font-sans text-4xl font-semibold leading-tight text-[color:var(--foreground)] md:text-5xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          Turn your YouTube channel into a personalized AI coaching assistant
        </motion.h1>

        <motion.p
          className="text-pretty mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--muted-foreground)] md:text-lg"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          OracleAI learns your voice, tone, and content to deliver interactive, on‑brand coaching. Built for creators
          and teams ready to scale impact—without more screen time.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <Link href="/dashboard">
            <Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff] shadow-[0_0_0_2px_rgba(0,217,255,0.25)_inset]">
              Create your AI Coach
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button
              variant="ghost"
              className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            >
              See how it works
            </Button>
          </Link>
        </motion.div>

        {/* Kinetic stat badges */}
        <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["~3 min", "Setup time"],
            ["98.7%", "On‑brand answers"],
            ["10x", "Fan engagement"],
            ["24/7", "Always available"],
          ].map(([k, v], i) => (
            <motion.div
              key={k}
              className="card-border rounded-xl px-4 py-3 text-left"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="font-sans text-lg font-semibold text-[color:var(--foreground)]">{k}</div>
              <div className="text-sm text-[color:var(--muted-foreground)]">{v}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
