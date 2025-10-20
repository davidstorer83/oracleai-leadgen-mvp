"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CreateCoachModal } from "./create-coach-modal"
import useSWR from "swr"

const fetcher = (url: string) => {
  const token = localStorage.getItem('auth-token')
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((r) => r.json())
}
export function TopNav() {
  const { mutate } = useSWR("/api/coaches", fetcher)

  return (
    <div className="border-b border-border bg-background/60 backdrop-blur">
      <div className="mx-auto max-w-8xl px-4 py-3 flex items-center justify-between">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search coaches, leads..."
            className="bg-secondary border-border text-white placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-3">
        <CreateCoachModal 
            onCreated={() => mutate()}
            trigger={<Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff]">New Coach</Button>}
          />
        
        </div>
      </div>
    </div>
  )
}
