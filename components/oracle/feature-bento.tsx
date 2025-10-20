"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { BotMessageSquare, Headphones, Share2, BarChart3, ShieldCheck, Sparkles } from "lucide-react"

const items = [
  {
    icon: BotMessageSquare,
    title: "Your Voice & Tone",
    desc: "Answers like you—trained on your videos.",
    span: "md:col-span-7",
  },
  {
    icon: BarChart3,
    title: "Leads & Insights",
    desc: "Capture emails and track results automatically.",
    span: "md:col-span-5",
  },
  {
    icon: Headphones,
    title: "Personalized Coaching",
    desc: "Step-by-step, contextual guidance.",
    span: "md:col-span-5",
  },
  { icon: Share2, title: "Embed Anywhere", desc: "Drop one snippet to deploy.", span: "md:col-span-7" },
  { icon: ShieldCheck, title: "Privacy Controls", desc: "Select videos and restrict topics.", span: "md:col-span-6" },
  { icon: Sparkles, title: "Fast Setup", desc: "Connect, train, deploy in minutes.", span: "md:col-span-6" },
]

export default function FeatureBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {items.map((it, i) => (
        <motion.div
          key={it.title}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: i * 0.05 }}
          className={it.span}
        >
          <Card className="bg-secondary border-border hover:glow-ring transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-[#0f0f0f] ring-1 ring-border p-2">
                  <it.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{it.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{it.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
