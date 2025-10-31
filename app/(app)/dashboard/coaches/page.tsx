"use client"

import useSWR from "swr"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateCoachModal } from "@/components/oracle/create-coach-modal"
import { Avatar } from "@/components/ui/avatar"
import { PageLoader, ButtonLoader } from "@/components/ui/loader"
import { Trash2, CheckSquare, Square, Share2, Copy } from "lucide-react"
import { ConfirmationDialog, useConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => {
  const token = localStorage.getItem('auth-token')
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((r) => r.json())
}

export default function CoachesPage() {
  const { data, mutate, isLoading } = useSWR("/api/coaches", fetcher)
  const [selectedCoaches, setSelectedCoaches] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [shareData, setShareData] = useState<Record<string, any>>({})
  const [isTogglingShare, setIsTogglingShare] = useState<Record<string, boolean>>({})
  const { showDialog, closeDialog, isOpen, config } = useConfirmationDialog()
  const { toast } = useToast()
  
  // Loading check after all hooks
  if (isLoading) {
    return <PageLoader />
  }

  const coaches = data?.coaches ?? []
  const isAllSelected = coaches.length > 0 && selectedCoaches.length === coaches.length
  const isSomeSelected = selectedCoaches.length > 0

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCoaches([])
    } else {
      setSelectedCoaches(coaches.map((c: any) => c.id))
    }
  }

  const handleSelectCoach = (coachId: string) => {
    setSelectedCoaches(prev => 
      prev.includes(coachId) 
        ? prev.filter(id => id !== coachId)
        : [...prev, coachId]
    )
  }

  const handleDeleteSelected = () => {
    if (selectedCoaches.length === 0) return
    
    showDialog({
      title: `Delete ${selectedCoaches.length} Coach${selectedCoaches.length > 1 ? 'es' : ''}`,
      description: `Are you sure you want to delete ${selectedCoaches.length} coach${selectedCoaches.length > 1 ? 'es' : ''}? This action cannot be undone and will permanently remove all associated data including videos, chats, and leads.`,
      confirmText: `Delete ${selectedCoaches.length} Coach${selectedCoaches.length > 1 ? 'es' : ''}`,
      variant: "destructive",
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          const token = localStorage.getItem('auth-token')
          const response = await fetch('/api/coaches', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ coachIds: selectedCoaches })
          })

          if (!response.ok) {
            throw new Error('Failed to delete coaches')
          }

          setSelectedCoaches([])
          mutate() // Refresh the data
        } catch (error) {
          console.error('Error deleting coaches:', error)
          showDialog({
            title: 'Delete Failed',
            description: 'Failed to delete coaches. Please try again.',
            confirmText: 'OK',
            variant: 'default',
            onConfirm: () => {}
          })
        } finally {
          setIsDeleting(false)
        }
      }
    })
  }

  const handleDeleteSingle = (coachId: string, coachName: string) => {
    showDialog({
      title: `Delete "${coachName}"`,
      description: `Are you sure you want to delete "${coachName}"? This action cannot be undone and will permanently remove all associated data including videos, chats, and leads.`,
      confirmText: 'Delete Coach',
      variant: "destructive",
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          const token = localStorage.getItem('auth-token')
          const response = await fetch('/api/coaches', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ coachIds: [coachId] })
          })

          if (!response.ok) {
            throw new Error('Failed to delete coach')
          }

          mutate() // Refresh the data
        } catch (error) {
          console.error('Error deleting coach:', error)
          showDialog({
            title: 'Delete Failed',
            description: 'Failed to delete coach. Please try again.',
            confirmText: 'OK',
            variant: 'default',
            onConfirm: () => {}
          })
        } finally {
          setIsDeleting(false)
        }
      }
    })
  }

  const fetchShareData = async (coachId: string) => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch(`/api/coaches/${coachId}/share`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setShareData(prev => ({ ...prev, [coachId]: data }))
      }
    } catch (error) {
      console.error('Error fetching share data:', error)
    }
  }

  const handleToggleShare = async (coachId: string) => {
    setIsTogglingShare(prev => ({ ...prev, [coachId]: true }))
    try {
      const token = localStorage.getItem('auth-token')
      const currentShareData = shareData[coachId]
      const response = await fetch(`/api/coaches/${coachId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isPublic: !currentShareData?.isPublic
        })
      })

      if (response.ok) {
        const data = await response.json()
        setShareData(prev => ({ ...prev, [coachId]: data }))
        toast({
          title: data.isPublic ? "Coach is now public!" : "Coach is now private",
          description: data.isPublic 
            ? "Your coach can now be shared with anyone using the share link." 
            : "Your coach is now private and only accessible to you.",
          variant: "default"
        })
      } else {
        toast({
          title: "Failed to update share status",
          description: "Please try again or contact support if the issue persists.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error toggling share status:', error)
      toast({
        title: "Network error",
        description: "Failed to update share status. Please check your connection and try again.",
        variant: "destructive"
      })
    } finally {
      setIsTogglingShare(prev => ({ ...prev, [coachId]: false }))
    }
  }

  const handleCopyShareLink = async (coachId: string) => {
    const currentShareData = shareData[coachId]
    if (currentShareData?.shareUrl) {
      try {
        await navigator.clipboard.writeText(currentShareData.shareUrl)
        toast({
          title: "Share link copied!",
          description: "The shareable link has been copied to your clipboard.",
          variant: "default"
        })
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        toast({
          title: "Failed to copy link",
          description: "Please copy the link manually from the share URL.",
          variant: "destructive"
        })
      }
    }
  }
  
  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Coaches</h1>
        <div className="flex items-center gap-2">
          {isSomeSelected && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <ButtonLoader />
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedCoaches.length})
                </>
              )}
            </Button>
          )}
        <CreateCoachModal
          onCreated={() => mutate()}
          trigger={<Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff]">New Coach</Button>}
        />
        </div>
      </div>

      <Card className="bg-secondary border-border">
        <CardHeader>
          <CardTitle className="text-white">Your AI Coaches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-white"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Coach ID</TableHead>
                <TableHead className="text-white">Channel</TableHead>
                <TableHead className="text-white">Videos</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coaches.map((c: any) => (
                <TableRow key={c.id} className={selectedCoaches.includes(c.id) ? "bg-primary/10" : ""}>
                  <TableCell>
                    <button
                      onClick={() => handleSelectCoach(c.id)}
                      className="flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-white"
                    >
                      {selectedCoaches.includes(c.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex items-center gap-2">
                      <Avatar 
                        src={c.avatar} 
                        alt={c.name} 
                        fallback={c.channelName || c.name}
                        size="sm"
                      />
                      {c.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <code className="text-xs bg-gray-800 px-2 py-1 rounded">{c.id}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.channelName || c.channelUrl}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <CoachVideosCell coach={c} />
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full text-xs px-2 py-1 ${
                      c.status === 'READY' ? 'bg-green-500/10 text-green-500' :
                      c.status === 'TRAINING' ? 'bg-yellow-500/10 text-yellow-500' :
                      c.status === 'ERROR' ? 'bg-red-500/10 text-red-500' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {c.status === 'READY' ? 'Ready' :
                       c.status === 'TRAINING' ? 'Training' :
                       c.status === 'ERROR' ? 'Error' : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <a href={`/dashboard/coaches/${c.id}`} className="text-sm text-muted-foreground hover:text-white">
                        View Details
                      </a>
                      {c.status === 'READY' && (
                        <a href={`/dashboard/chat/${c.id}`} className="text-sm text-primary hover:underline font-medium">
                          💬 Chat
                        </a>
                      )}
                      
                      {/* Share Buttons */}
                      {c.status === 'READY' && (
                        <>
                          <button
                            onClick={() => {
                              if (!shareData[c.id]) {
                                fetchShareData(c.id)
                              } else {
                                handleToggleShare(c.id)
                              }
                            }}
                            disabled={isTogglingShare[c.id]}
                            className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                              shareData[c.id]?.isPublic 
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30' 
                                : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30'
                            }`}
                            title={shareData[c.id]?.isPublic ? 'Make Private' : 'Make Public'}
                          >
                            {isTogglingShare[c.id] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                            ) : (
                              <Share2 className="h-4 w-4" />
                            )}
                          </button>

                          {shareData[c.id]?.isPublic && (
                            <button
                              onClick={() => handleCopyShareLink(c.id)}
                              className="p-2 rounded-lg transition-all duration-200 hover:scale-105 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30"
                              title="Copy Share Link"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                      
                      <button
                        onClick={() => handleDeleteSingle(c.id, c.name)}
                        disabled={isDeleting}
                        className="text-sm text-red-500 hover:text-red-400 disabled:opacity-50"
                        title="Delete coach"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {coaches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No coaches yet. Create your first coach.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      {config && (
        <ConfirmationDialog
          isOpen={isOpen}
          onClose={closeDialog}
          onConfirm={config.onConfirm}
          title={config.title}
          description={config.description}
          confirmText={config.confirmText}
          cancelText={config.cancelText}
          variant={config.variant}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}

function CoachVideosCell({ coach }: { coach: any }) {
  const { data } = useSWR(coach.status === 'TRAINING' ? `/api/coaches/${coach.id}/training` : null, fetcher, { refreshInterval: 2000 })
  const latestJob = data?.trainingJobs?.[0]
  if (coach.status === 'TRAINING' && latestJob) {
    const processed = latestJob.videosProcessed ?? 0
    const total = latestJob.videosTotal ?? (coach.videos?.length || 0)
    return (
      <span className="text-yellow-400">
        {processed}/{total} analyzed
      </span>
    )
  }
  return <>{coach.videos?.length || 0}</>
}
