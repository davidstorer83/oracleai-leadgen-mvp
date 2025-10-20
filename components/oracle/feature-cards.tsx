"use client"

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { BotMessageSquare, Headphones, Share2, BarChart3, ShieldCheck, Sparkles } from "lucide-react"

const features = [
  {
    icon: BotMessageSquare,
    title: "Your Voice & Tone",
    desc: "Trained on your videos to answer like you would.",
  },
  {
    icon: Headphones,
    title: "Personalized Coaching",
    desc: "Tailored feedback and step-by-step guidance.",
  },
  {
    icon: Share2,
    title: "Embed Anywhere",
    desc: "Drop a snippet to add your coach to your site.",
  },
  {
    icon: BarChart3,
    title: "Leads & Insights",
    desc: "Capture emails and track results automatically.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy Controls",
    desc: "Choose which videos and topics are allowed.",
  },
  {
    icon: Sparkles,
    title: "Fast Setup",
    desc: "Connect, train, and deploy in minutes.",
  },
]

export default function FeatureCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: i * 0.04 }}
        >
          <Card className="bg-secondary border-border hover:shadow-[0_0_0_1px_var(--color-ring)]/20 transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-md bg-[#0f0f0f] ring-1 ring-border p-2">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
