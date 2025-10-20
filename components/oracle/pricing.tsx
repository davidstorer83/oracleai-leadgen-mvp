"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "/mo",
    features: ["1 AI Coach", "Up to 5 videos trained", "Basic analytics", "Email capture"],
    cta: "Start Free",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    features: ["3 AI Coaches", "Unlimited videos", "Advanced analytics", "Custom embed & branding"],
    cta: "Upgrade",
    highlight: true,
  },
]

export default function Pricing() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map((p) => (
        <Card key={p.name} className={`border ${p.highlight ? "border-primary/50" : "border-border"} bg-secondary`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="font-semibold text-white">{p.name}</span>
              {p.highlight ? (
                <span className="rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">Popular</span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1">
              <div className="text-3xl font-semibold text-white">{p.price}</div>
              <div className="text-muted-foreground mb-1">{p.period}</div>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-muted-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/dashboard">
              <Button className="mt-5 w-full bg-primary text-primary-foreground hover:bg-[#11e1ff]">{p.cta}</Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
