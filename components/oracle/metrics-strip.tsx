"use client"

import { motion } from "framer-motion"

const metrics = [
  { label: "Creators onboarded", value: "3,200+" },
  { label: "Coaching sessions", value: "250k+" },
  { label: "Avg. CSAT", value: "4.9/5" },
  { label: "Leads captured", value: "1.1M+" },
]

export default function MetricsStrip() {
  return (
    <div className="mt-10 rounded-xl border border-border bg-secondary px-4 py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.05 }}
            className="text-center"
          >
            <div className="text-white text-lg font-semibold">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
