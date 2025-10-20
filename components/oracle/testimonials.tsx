"use client"

import { motion } from "framer-motion"

const quotes = [
  { q: "OracleAI feels like me—fans finally get answers in my voice.", a: "Creator in Fitness" },
  { q: "Lead quality went up immediately. It’s like office hours, always on.", a: "Education Channel" },
  { q: "Setup was shockingly fast. The tone matching is uncanny.", a: "Tech Reviewer" },
]

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-8 text-center">
        <h2 className="text-balance font-sans text-3xl font-semibold text-[color:var(--foreground)] md:text-4xl">
          What creators say
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quotes.map((t, i) => (
          <motion.figure
            key={t.q}
            className="card-border relative rounded-2xl p-5"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full bg-[color:var(--accent)]/10 blur-2xl" />
            <blockquote className="text-pretty text-[color:var(--foreground)]">{t.q}</blockquote>
            <figcaption className="mt-3 text-sm text-[color:var(--muted-foreground)]">— {t.a}</figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  )
}
