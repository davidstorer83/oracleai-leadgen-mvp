'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Send, Bot, User, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface Coach {
  id: string
  name: string
  channelName: string
  avatar?: string
  description?: string
  metadata?: any
}

export default function PublicChatPage() {
  const params = useParams()
  const shareableId = params.shareableId as string
  
  const [coach, setCoach] = useState<Coach | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCoach, setIsLoadingCoach] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load coach information
  useEffect(() => {
    const fetchCoach = async () => {
      try {
        const response = await fetch(`/api/coaches/public/${shareableId}`)
        if (response.ok) {
          const coachData = await response.json()
          setCoach(coachData)
          
          // Add professional welcome message
          const channelDescription = coachData.metadata?.channelInfo?.description || coachData.description || ''
          const welcomeMessage = `Hey! I'm ${coachData.name}. I love talking about ${channelDescription ? channelDescription.substring(0, 100) + '...' : 'productivity, business, and personal development'}. What can I help you with today?`
          
          setMessages([{
            id: '1',
            content: welcomeMessage,
            role: 'assistant',
            timestamp: new Date()
          }])
        }
      } catch (error) {
        // Error fetching coach
      } finally {
        setIsLoadingCoach(false)
      }
    }

    fetchCoach()
  }, [shareableId])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          coachId: coach?.id,
          shareableId: shareableId
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.message,
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again.',
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isLoadingCoach) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading AI Coach...</p>
        </div>
      </div>
    )
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Coach Not Found</h1>
          <p className="text-gray-600 mb-4">This AI coach is not available or has been removed.</p>
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex flex-col justify-start">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/coach/${shareableId}`} className='text-gray-600  bg-primary hover:text-white rounded-md p-2 flex gap-2 items-center'>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Profile
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar 
                    src={coach.avatar || ''} 
                    alt={coach.name} 
                    fallback={coach.name}
                    className="w-12 h-12 ring-2 ring-white shadow-md"
                    size="lg"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{coach.name}</h1>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    AI Coach Online
                  </p>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500 font-medium">
              Powered by Oracle AI
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="container mx-auto px-4 py-6 flex-1 min-h-0">
        <div className="max-w-6xl mx-auto h-full">
          {/* Chat Messages */}
          <Card className="h-full flex flex-col shadow-lg border border-gray-200 bg-white">
            <CardHeader className="py-4 bg-gray-50 flex-shrink-0">
              <CardTitle className="text-center text-xl font-bold text-gray-900">
                Chat with {coach.name}
              </CardTitle>
              <p className="text-center text-sm text-gray-600 mt-1">
                Ask questions and get personalized insights
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <div className="flex-1 overflow-y-auto space-y-6 p-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar 
                        src={coach.avatar || ''} 
                        alt={coach.name} 
                        fallback={coach.name}
                        className="w-10 h-10 flex-shrink-0 ring-2 ring-white shadow-md"
                        size="md"
                      />
                    )}
                    
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="prose prose-sm max-w-none leading-relaxed prose-headings:font-semibold prose-p:mb-3 prose-ul:mb-3 prose-ol:mb-3">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <Avatar 
                        fallback="You"
                        className="w-10 h-10 flex-shrink-0 ring-2 ring-blue-200 shadow-md"
                        size="md"
                      />
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <Avatar 
                      src={coach.avatar || ''} 
                      alt={coach.name} 
                      fallback={coach.name}
                      className="w-10 h-10 flex-shrink-0 ring-2 ring-white shadow-md"
                      size="md"
                    />
                    <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-gray-600 font-medium">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
