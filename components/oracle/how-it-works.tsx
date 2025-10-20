"use client"

import { motion } from "framer-motion"

const steps = [
  { t: "Connect YouTube", d: "Import your channel or playlist. No code required." },
  { t: "Train your Coach", d: "We align on your tone and content. You approve a sample." },
  { t: "Publish anywhere", d: "Embed with one line or share a link. Ready in minutes." },
  { t: "Capture & convert", d: "Guide fans to take action with smart, contextual prompts." },
]

export default function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-7xl px-6 py-20">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="sticky top-24 self-start">
          <h2 className="text-balance font-sans text-3xl font-semibold text-[color:var(--foreground)] md:text-4xl">
            How it works
          </h2>
          <p className="mt-3 max-w-md text-[color:var(--muted-foreground)]">
            Your assistant mirrors your best content—and grows with every conversation.
          </p>
          <div className="mt-6 h-44 w-full rounded-2xl bg-[radial-gradient(closest-side,rgba(0,217,255,0.15),transparent_60%)] motion-rotate-slow" />
        </div>

        <div className="space-y-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.t}
              className="card-border rounded-2xl p-5"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="text-sm text-[color:var(--accent)]">Step {i + 1}</div>
              <div className="mt-1 font-sans text-xl font-semibold text-[color:var(--foreground)]">{s.t}</div>
              <div className="mt-1 text-[color:var(--muted-foreground)]">{s.d}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
