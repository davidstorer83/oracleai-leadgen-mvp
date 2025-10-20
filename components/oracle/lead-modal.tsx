"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit } from "lucide-react"

export function LeadModal({
  trigger,
  onCreated,
  lead,
  coaches,
}: {
  trigger: React.ReactNode
  onCreated?: () => void
  lead?: any
  coaches?: any[]
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(lead?.email || "")
  const [name, setName] = useState(lead?.name || "")
  const [phone, setPhone] = useState(lead?.phone || "")
  const [source, setSource] = useState(lead?.source || "chat")
  const [status, setStatus] = useState(lead?.status || "new")
  const [notes, setNotes] = useState(lead?.notes || "")
  const [coachId, setCoachId] = useState(lead?.coachId || "")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isEdit = !!lead

  async function submit() {
    if (!email || !coachId) {
      toast({ 
        title: "Missing fields", 
        description: "Email and Coach are required.", 
        variant: "destructive" 
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('auth-token')
      
      if (isEdit) {
        // Update existing lead
        const res = await fetch(`/api/leads/${lead.id}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            status,
            notes
          }),
        })
        
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Failed to update lead")
        }
        
        toast({ title: "Lead updated", description: "Lead has been updated successfully." })
      } else {
        // Create new lead
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            email,
            name,
            phone,
            source,
            status,
            notes,
            coachId
          }),
        })
        
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || "Failed to create lead")
        }
        
        toast({ title: "Lead created", description: "New lead has been created successfully." })
      }
      
      setOpen(false)
      resetForm()
      onCreated?.()
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setEmail("")
    setName("")
    setPhone("")
    setSource("chat")
    setStatus("new")
    setNotes("")
    setCoachId("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-secondary border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEdit ? "Edit Lead" : "Add New Lead"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-white">Email *</Label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="john@example.com" 
              type="email"
              disabled={isEdit} // Don't allow editing email for existing leads
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-white">Name</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="John Doe" 
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-white">Phone</Label>
            <Input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="+1-555-0123" 
            />
          </div>
          
          <div className="grid gap-2">
            <Label className="text-white">Coach *</Label>
            <Select value={coachId} onValueChange={setCoachId} disabled={isEdit}>
              <SelectTrigger className="bg-background border-border text-white">
                <SelectValue placeholder="Select a coach" />
              </SelectTrigger>
              <SelectContent>
                {coaches?.map((coach) => (
                  <SelectItem key={coach.id} value={coach.id}>
                    {coach.name || coach.channelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label className="text-white">Source</Label>
            <Select value={source} onValueChange={setSource} disabled={isEdit}>
              <SelectTrigger className="bg-background border-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="embed">Embed</SelectItem>
                <SelectItem value="landing">Landing Page</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label className="text-white">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-background border-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label className="text-white">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this lead..."
              rows={3}
            />
          </div>
          
          <Button 
            onClick={submit} 
            disabled={loading} 
            className="bg-primary text-primary-foreground hover:bg-[#11e1ff] w-full"
          >
            {loading ? "Saving..." : (isEdit ? "Update Lead" : "Create Lead")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
