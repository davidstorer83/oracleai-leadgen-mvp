"use client"

import { motion } from "framer-motion"

const items = [
  { k: "2.3M+", v: "Answers delivered" },
  { k: "7.9x", v: "Avg. session length" },
  { k: "42%", v: "Leads captured" },
  { k: "<3min", v: "From import to live" },
]

export default function Metrics() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((it, i) => (
          <motion.div
            key={it.k}
            className="card-border rounded-xl p-5"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="font-sans text-2xl font-semibold text-[color:var(--foreground)]">{it.k}</div>
            <div className="text-sm text-[color:var(--muted-foreground)]">{it.v}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
