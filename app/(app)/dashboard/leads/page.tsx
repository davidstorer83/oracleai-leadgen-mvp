"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Mail, Phone, Calendar, Edit, Trash2, CheckSquare, Square } from "lucide-react"
import { LeadModal } from "@/components/oracle/lead-modal"
import { PageLoader, ButtonLoader } from "@/components/ui/loader"
import { ConfirmationDialog, useConfirmationDialog } from "@/components/ui/confirmation-dialog"

const fetcher = (url: string) => {
  const token = localStorage.getItem('auth-token')
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((r) => r.json())
}

function getStatusColor(status: string) {
  switch (status) {
    case 'new': return 'bg-blue-500'
    case 'contacted': return 'bg-yellow-500'
    case 'qualified': return 'bg-green-500'
    case 'converted': return 'bg-purple-500'
    default: return 'bg-gray-500'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function safeParseMetadata(metadata: any) {
  if (!metadata) return null
  
  // If it's already an object, return it
  if (typeof metadata === 'object') {
    return metadata
  }
  
  // If it's a string, try to parse it
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata)
    } catch (error) {
      console.warn('Failed to parse metadata JSON:', error)
      return null
    }
  }
  
  return null
}

export default function LeadsPage() {
  const { data, mutate, isLoading } = useSWR("/api/leads", fetcher)
  const { data: coachesData, isLoading: coachesLoading } = useSWR("/api/coaches", fetcher)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const { showDialog, closeDialog, isOpen, config } = useConfirmationDialog()
  
  // Loading check after all hooks
  if (isLoading || coachesLoading) {
    return <PageLoader />
  }
  
  const allLeads = data?.leads ?? []
  // Filter out coach creation leads - only show actual leads
  const leads = allLeads.filter((lead: any) => {
    const metadata = safeParseMetadata(lead.metadata)
    return !metadata || metadata.type !== 'coach_creator'
  })
  
  // Log filtering results
  const coachCreationLeads = allLeads.filter((lead: any) => {
    const metadata = safeParseMetadata(lead.metadata)
    return metadata && metadata.type === 'coach_creator'
  })
  
  
  const coaches = coachesData?.coaches ?? []
  const isAllSelected = leads.length > 0 && selectedLeads.length === leads.length
  const isSomeSelected = selectedLeads.length > 0

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(leads.map((l: any) => l.id))
    }
  }

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    )
  }

  const handleDeleteSelected = () => {
    if (selectedLeads.length === 0) return
    
    showDialog({
      title: `Delete ${selectedLeads.length} Lead${selectedLeads.length > 1 ? 's' : ''}`,
      description: `Are you sure you want to delete ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone and will permanently remove all lead data.`,
      confirmText: `Delete ${selectedLeads.length} Lead${selectedLeads.length > 1 ? 's' : ''}`,
      variant: "destructive",
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          const token = localStorage.getItem('auth-token')
          const response = await fetch('/api/leads', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadIds: selectedLeads })
          })

          if (!response.ok) {
            throw new Error('Failed to delete leads')
          }

          setSelectedLeads([])
          mutate() // Refresh the data
        } catch (error) {
          console.error('Error deleting leads:', error)
          showDialog({
            title: 'Delete Failed',
            description: 'Failed to delete leads. Please try again.',
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

  const handleDeleteSingle = (leadId: string, leadName: string) => {
    showDialog({
      title: `Delete Lead "${leadName}"`,
      description: `Are you sure you want to delete lead "${leadName}"? This action cannot be undone and will permanently remove all lead data.`,
      confirmText: 'Delete Lead',
      variant: "destructive",
      onConfirm: async () => {
        setIsDeleting(true)
        try {
          const token = localStorage.getItem('auth-token')
          const response = await fetch('/api/leads', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ leadIds: [leadId] })
          })

          if (!response.ok) {
            throw new Error('Failed to delete lead')
          }

          mutate() // Refresh the data
        } catch (error) {
          console.error('Error deleting lead:', error)
          showDialog({
            title: 'Delete Failed',
            description: 'Failed to delete lead. Please try again.',
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
  const totalLeads = leads.length
  const newLeads = leads.filter((l: any) => l.status === 'new').length
  const contactedLeads = leads.filter((l: any) => l.status === 'contacted').length
  const qualifiedLeads = leads.filter((l: any) => l.status === 'qualified').length
  const convertedLeads = leads.filter((l: any) => l.status === 'converted').length
  
  // Calculate conversion rate
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0'
  
  // Get leads by source
  const leadsBySource = leads.reduce((acc: any, lead: any) => {
    acc[lead.source] = (acc[lead.source] || 0) + 1
    return acc
  }, {})
  
  // Get recent leads (last 7 days)
  const recentLeads = leads.filter((lead: any) => {
    const leadDate = new Date(lead.createdAt)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return leadDate > weekAgo
  }).length

  const handleLeadUpdate = () => {
    mutate() // Refresh the leads data
  }

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Leads</h1>
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
                  Delete ({selectedLeads.length})
                </>
              )}
            </Button>
          )}
          <LeadModal
            onCreated={handleLeadUpdate}
            coaches={coaches}
            trigger={
              <Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff]">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-secondary border-border">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-white">{totalLeads}</p>
                <p className="text-xs text-muted-foreground">+{recentLeads} this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary border-border">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">New Leads</p>
                <p className="text-2xl font-bold text-white">{newLeads}</p>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary border-border">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-500 rounded-lg">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold text-white">{qualifiedLeads}</p>
                <p className="text-xs text-muted-foreground">High potential</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary border-border">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 rounded-lg">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Converted</p>
                <p className="text-2xl font-bold text-white">{convertedLeads}</p>
                <p className="text-xs text-muted-foreground">{conversionRate}% rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Analytics */}
      {Object.keys(leadsBySource).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(leadsBySource).map(([source, count]) => (
            <Card key={source} className="bg-secondary border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground capitalize">
                      {source.replace('_', ' ')} Leads
                    </p>
                    <p className="text-xl font-bold text-white">{count as number}</p>
                  </div>
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Leads Table */}
      <Card className="bg-secondary border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Lead Management</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-muted-foreground">
                {totalLeads} Total
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {conversionRate}% Conversion
              </Badge>
            </div>
          </div>
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
                <TableHead className="text-white">Contact</TableHead>
                <TableHead className="text-white">Coach</TableHead>
                <TableHead className="text-white">Source</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead: any) => (
                <TableRow key={lead.id} className={`hover:bg-secondary/50 ${selectedLeads.includes(lead.id) ? "bg-primary/10" : ""}`}>
                  <TableCell>
                    <button
                      onClick={() => handleSelectLead(lead.id)}
                      className="flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-white"
                    >
                      {selectedLeads.includes(lead.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-white flex items-center">
                        {lead.name || 'Unknown'}
                        {(() => {
                          const metadata = safeParseMetadata(lead.metadata)
                          if (metadata && metadata.type === 'coach_creator') {
                            return (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Creator
                              </Badge>
                            )
                          }
                          if (metadata && metadata.type === 'youtube_channel') {
                            return (
                              <Badge variant="outline" className="ml-2 text-xs border-red-500 text-red-400">
                                YouTube
                              </Badge>
                            )
                          }
                          return null
                        })()}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {lead.phone}
                        </div>
                      )}
                      {(() => {
                        const metadata = safeParseMetadata(lead.metadata)
                        if (metadata && metadata.type === 'youtube_channel' && metadata.channelInfo) {
                          const channelInfo = metadata.channelInfo
                          return (
                            <div className="space-y-1 mt-2">
                              {channelInfo.subscriberCount && (
                                <div className="text-xs text-muted-foreground">
                                  👥 {channelInfo.subscriberCount.toLocaleString()} subscribers
                                </div>
                              )}
                              {channelInfo.verified && (
                                <div className="text-xs text-blue-400">
                                  ✓ Verified Channel
                                </div>
                              )}
                              {channelInfo.contactInfo && (
                                <div className="space-y-1 mt-2">
                                  <div className="text-xs text-muted-foreground font-medium">Contact Info:</div>
                                  {channelInfo.contactInfo.emails && channelInfo.contactInfo.emails.length > 0 && (
                                    <div className="space-y-1">
                                      {channelInfo.contactInfo.emails.slice(0, 2).map((email: string, index: number) => (
                                        <div key={index} className="text-xs text-green-400 flex items-center gap-1">
                                          <span>📧</span>
                                          <span className="truncate max-w-[200px]">{email}</span>
                                        </div>
                                      ))}
                                      {channelInfo.contactInfo.emails.length > 2 && (
                                        <div className="text-xs text-muted-foreground">
                                          +{channelInfo.contactInfo.emails.length - 2} more emails
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {channelInfo.contactInfo.websites && channelInfo.contactInfo.websites.length > 0 && (
                                    <div className="space-y-1">
                                      {channelInfo.contactInfo.websites.slice(0, 2).map((website: string, index: number) => (
                                        <div key={index} className="text-xs text-blue-400 flex items-center gap-1">
                                          <span>🌐</span>
                                          <span className="truncate max-w-[200px]">
                                            {website.replace('https://', '').replace('http://', '')}
                                          </span>
                                        </div>
                                      ))}
                                      {channelInfo.contactInfo.websites.length > 2 && (
                                        <div className="text-xs text-muted-foreground">
                                          +{channelInfo.contactInfo.websites.length - 2} more websites
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {channelInfo.contactInfo.phones && channelInfo.contactInfo.phones.length > 0 && (
                                    <div className="space-y-1">
                                      {channelInfo.contactInfo.phones.slice(0, 2).map((phone: string, index: number) => (
                                        <div key={index} className="text-xs text-orange-400 flex items-center gap-1">
                                          <span>📞</span>
                                          <span>{phone}</span>
                                        </div>
                                      ))}
                                      {channelInfo.contactInfo.phones.length > 2 && (
                                        <div className="text-xs text-muted-foreground">
                                          +{channelInfo.contactInfo.phones.length - 2} more phones
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {channelInfo.contactInfo.isBusiness && (
                                    <div className="text-xs text-purple-400 flex items-center gap-1">
                                      <span>🏢</span>
                                      <span>Business Account</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {channelInfo.socialMedia && Object.keys(channelInfo.socialMedia).length > 0 && (
                                <div className="space-y-1 mt-2">
                                  <div className="text-xs text-muted-foreground font-medium">Social Media:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(channelInfo.socialMedia).map(([platform, links]: [string, any]) => {
                                      const platformIcons: { [key: string]: string } = {
                                        instagram: '📷',
                                        twitter: '🐦',
                                        facebook: '📘',
                                        linkedin: '💼',
                                        tiktok: '🎵',
                                        youtube: '📺',
                                        discord: '💬',
                                        telegram: '✈️',
                                        snapchat: '👻',
                                        twitch: '🎮'
                                      }
                                      
                                      return (
                                        <div key={platform} className="flex items-center gap-1">
                                          <span className="text-xs">{platformIcons[platform] || '🔗'}</span>
                                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                                            {platform}
                                          </Badge>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-muted-foreground">
                      {lead.coach}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-muted-foreground capitalize">
                      {lead.source.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(lead.status)} text-white capitalize`}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-muted-foreground">
                      <div className="text-sm">{formatDate(lead.createdAt)}</div>
                      {lead.notes && (
                        <div className="text-xs text-muted-foreground/70 truncate max-w-[150px]" title={lead.notes}>
                          {lead.notes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {/* <LeadModal
                        onCreated={handleLeadUpdate}
                        coaches={coaches}
                        lead={lead}
                        trigger={
                          <Button size="sm" variant="outline" title="Edit Lead">
                            <Edit className="w-3 h-3" />
                          </Button>
                        }
                      /> */}
                      <Button size="sm" variant="outline" title="Send Email">
                        <Mail className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" title="Call">
                        <Phone className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        title="Delete Lead"
                        onClick={() => handleDeleteSingle(lead.id, lead.name || lead.email)}
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-400 hover:border-red-400 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-primary/10 rounded-full">
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">No leads yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Leads will automatically appear here when people interact with your AI coaches. 
                          You can also manually add leads using the "Add Lead" button above.
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <LeadModal
                          onCreated={handleLeadUpdate}
                          coaches={coaches}
                          trigger={
                            <Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff]">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Your First Lead
                            </Button>
                          }
                        />
                      </div>
                    </div>
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
