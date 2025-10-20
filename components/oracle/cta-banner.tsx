"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function CtaBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-xl border border-border bg-secondary p-6 glow-ring"
    >
      <div>
        <h3 className="text-white font-semibold text-balance">Turn your channel into a coach</h3>
        <p className="text-muted-foreground">Start for free. Upgrade as you grow.</p>
      </div>
      <Link href="/dashboard">
        <Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff] glow-pulse">
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </motion.div>
  )
}
