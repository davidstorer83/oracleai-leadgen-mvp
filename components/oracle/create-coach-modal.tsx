"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"

export function CreateCoachModal({
  trigger,
  onCreated,
}: {
  trigger: React.ReactNode
  onCreated?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [channelUrl, setChannelUrl] = useState("")
  const [description, setDescription] = useState("")
  const [tone, setTone] = useState("friendly, helpful, and knowledgeable")
  const [creativityLevel, setCreativityLevel] = useState(0.7)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function submit() {
    if (!name || !email || !channelUrl) {
      toast({ title: "Missing fields", description: "Name, Email, and YouTube Channel URL are required.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch("/api/coaches", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          email, 
          channelUrl, 
          description, 
          tone, 
          creativityLevel 
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create coach")
      }
      toast({ title: "Coach created", description: "Training started. This may take a few minutes." })
      setOpen(false)
      setName("")
      setEmail("")
      setChannelUrl("")
      setDescription("")
      setTone("friendly, helpful, and knowledgeable")
      setCreativityLevel(0.7)
      onCreated?.()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-secondary border-border">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Coach AI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-white">Coach Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sam Matheson" />
          </div>
          <div className="grid gap-2">
            <Label className="text-white">Email</Label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="e.g., sam.matheson@example.com" 
              type="email" 
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-white">YouTube Channel URL</Label>
            <Input
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="e.g., https://www.youtube.com/@aliabdaal"
            />
            <p className="text-xs text-muted-foreground">
              Enter the full YouTube channel URL (e.g., https://www.youtube.com/@username)
            </p>
          </div>
          <div className="grid gap-2">
            <Label className="text-white">Description (Optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the coach and their expertise..."
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-white">Tone & Personality</Label>
            <Input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="friendly, helpful, and knowledgeable"
            />
            <p className="text-xs text-muted-foreground">Describe how the AI should communicate</p>
          </div>
          <div className="grid gap-2">
            <Label className="text-white">Creativity Level: {creativityLevel}</Label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[creativityLevel]}
              onValueChange={(val) => setCreativityLevel(val[0])}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Lower = more focused, Higher = more creative</p>
          </div>
          <Button onClick={submit} disabled={loading} className="bg-primary text-primary-foreground hover:bg-[#11e1ff]">
            {loading ? "Creating..." : "Create Coach"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

