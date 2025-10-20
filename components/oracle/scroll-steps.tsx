"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

const steps = [
  { title: "Connect Channel", desc: "Link your YouTube and select training videos." },
  { title: "Train Voice", desc: "Build a knowledge base and style profile." },
  { title: "Deploy Anywhere", desc: "Embed your coach on any site—24/7." },
]

export default function ScrollSteps() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="sticky top-24 self-start">
        <h3 className="text-white font-semibold text-balance">From channel to coach in minutes</h3>
        <p className="text-muted-foreground mt-2">A streamlined path to production with zero code required.</p>
        <div className="mt-4 h-1 w-24 bg-primary/40 rounded" />
      </div>
      <div className="space-y-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card className="bg-secondary border-border">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-md bg-[#0f0f0f] ring-1 ring-border p-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{s.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
