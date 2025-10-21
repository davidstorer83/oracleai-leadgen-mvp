"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Loader, ChatLoader, PageLoader } from "@/components/ui/loader"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import ReactMarkdown from 'react-markdown'

type Msg = { role: "user" | "assistant"; content: string }

function createPersonalizedGreeting(coach: any): string {
  const name = coach.name || "your coach"
  const description = coach.description || ""
  const channelName = coach.channelName || ""
  const tone = coach.tone || "friendly, helpful, and knowledgeable"
  
  // Create a personalized greeting that sounds like the actual person
  if (name.toLowerCase().includes('raj') && name.toLowerCase().includes('shamani')) {
    return `Hi! I'm Raj Shamani 👋

Welcome to this space — I believe the next 10 years are going to be India's Golden Age, full of once-in-a-lifetime opportunities. But here's the thing — if you don't prepare yourself to win these opportunities, you'll miss your shot at achieving your Indian Dream.

And I'm not going to let that happen.

This is my way of helping you learn, grow, and figure things out every single day — whether it's business, mindset, relationships, or life lessons from top leaders across the world.

So whatever question you have — ask me.
Let's figure it out together and build the life you dream of.`
  }
  
  // Create a more professional and varied greeting
  const greetings = [
    `Hello! I'm ${name}. I'm here to help you with questions and insights based on my expertise and experience.`,
    `Hi there! I'm ${name}. I'd be happy to share my knowledge and help you with any questions you might have.`,
    `Hey! I'm ${name}. I'm excited to chat and share insights from my experience. What would you like to know?`,
    `Welcome! I'm ${name}. I'm here to help you learn and grow through our conversation.`
  ]
  
  // Select a random greeting to avoid repetition
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
  
  // Add specific context if available
  let context = ""
  if (description && description.length > 10) {
    context = ` I specialize in ${description.toLowerCase()}.`
  } else if (channelName) {
    context = ` I'm passionate about ${channelName} and helping people grow.`
  }
  
  return randomGreeting + context + " What's on your mind?"
}

export default function ChatPage() {
  const params = useParams()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [coach, setCoach] = useState<any>(null)
  const [coachLoading, setCoachLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch coach details
    const token = localStorage.getItem('auth-token')
    fetch(`/api/coaches/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setCoach(data.coach)
        setCoachLoading(false)
        if (data.coach.status !== 'READY') {
          setMessages([{ role: "assistant", content: "This coach is not ready yet. Please wait for training to complete." }])
        } else {
          // Create personalized greeting based on coach description and channel info
          const personalizedGreeting = createPersonalizedGreeting(data.coach)
          setMessages([{ role: "assistant", content: personalizedGreeting }])
        }
      })
      .catch(error => {
        console.error('Error fetching coach:', error)
        setCoachLoading(false)
      })
  }, [params.id])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    if (!input.trim() || coach?.status !== 'READY') return
    
    const userMessage = input.trim()
    setInput("")
    setLoading(true)
    
    // Add user message immediately
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: userMessage, 
          coachId: params.id, 
          chatId: chatId 
        }),
      })
      
      if (!res.ok) {
        throw new Error('Failed to send message')
      }
      
      const data = await res.json()
      
      // Set chat ID if this is a new chat
      if (!chatId && data.chatId) {
        setChatId(data.chatId)
      }
      
      // Add assistant response
      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  if (coachLoading) {
    return <PageLoader />
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-secondary">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/coaches" className="text-muted-foreground hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Avatar 
              src={coach?.avatar} 
              alt={coach?.name} 
              fallback={coach?.channelName || coach?.name}
              size="lg"
            />
            <div>
              <h1 className="text-xl font-semibold text-white">
                {coachLoading ? <Loader size="sm" text="Loading coach..." /> : (coach?.name || 'Unknown Coach')}
              </h1>
              <p className="text-sm text-muted-foreground">{coach?.channelName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="max-w-8xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg p-4 ${
                m.role === "user" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}>
                <div className="prose prose-sm max-w-none leading-relaxed prose-headings:font-semibold prose-p:mb-3 prose-ul:mb-3 prose-ol:mb-3">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && <ChatLoader />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-secondary">
        <div className="max-w-8xl mx-auto">
          <div className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={coach?.status === 'READY' ? "Ask your AI coach..." : "Coach is not ready yet..."}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              disabled={coach?.status !== 'READY' || loading}
              className="flex-1 bg-background border-border text-white"
            />
            <Button 
              onClick={send} 
              disabled={loading || coach?.status !== 'READY' || !input.trim()} 
              className="bg-primary text-primary-foreground hover:bg-[#11e1ff] px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
