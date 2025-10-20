"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const items = [
  {
    q: "How does the AI learn my voice?",
    a: "You connect your channel and select videos. OracleAI builds a knowledge base and style profile from your content and tone.",
  },
  {
    q: "Can I control what it says?",
    a: "Yes. You can restrict topics, exclude videos, and add brand voice rules from settings.",
  },
  {
    q: "How do I embed it?",
    a: "Copy a small snippet from the dashboard and paste it on your website or landing page.",
  },
  {
    q: "Is there a free plan?",
    a: "Start on Starter to try OracleAI with one coach. Upgrade anytime.",
  },
]

export default function FAQ() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {items.map((it) => (
        <AccordionItem key={it.q} value={it.q}>
          <AccordionTrigger className="text-white">{it.q}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
