"use client"

import { motion } from "framer-motion"

const brands = ["CreatorHub", "SkillForge", "ProTube", "GrowthLab", "StudioOne", "CourseFlow"]

export default function TrustBar() {
  return (
    <div className="rounded-xl border border-border bg-secondary px-4 py-3">
      <div className="flex items-center justify-center gap-6 flex-wrap text-muted-foreground text-sm">
        {brands.map((b, i) => (
          <motion.span
            key={b}
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 0.9, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
          >
            {b}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
