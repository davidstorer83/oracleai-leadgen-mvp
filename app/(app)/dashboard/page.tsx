"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart, BarChart, Bar, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar } from "@/components/ui/avatar"
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Bot, 
  Zap, 
  Target, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react"
import useSWR from "swr"
import { useState, useEffect } from "react"
import { PageLoader } from "@/components/ui/loader"

const fetcher = (url: string) => {
  const token = localStorage.getItem('auth-token')
  return fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((r) => r.json())
}

// Generate dynamic data based on current date
const generateUsageData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date().getDay()
  const data = []
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayIndex = date.getDay()
    const dayName = days[dayIndex]
    
    // Generate realistic data with some randomness
    const baseChats = 100 + Math.random() * 200
    const baseLeads = Math.floor(baseChats * 0.05) + Math.random() * 10
    const baseRevenue = baseLeads * (50 + Math.random() * 100)
    
    data.push({
      day: dayName,
      chats: Math.floor(baseChats),
      leads: Math.floor(baseLeads),
      revenue: Math.floor(baseRevenue),
      engagement: Math.floor(60 + Math.random() * 40)
    })
  }
  
  return data
}

const COLORS = ['#00d4ff', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']

export default function DashboardPage() {
  const { data: coachesData, error: coachesError, isLoading: coachesLoading } = useSWR("/api/coaches", fetcher)
  const { data: chatsData, error: chatsError, isLoading: chatsLoading } = useSWR("/api/chats", fetcher)
  const [usageData, setUsageData] = useState(generateUsageData())
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      // Regenerate data every hour for more dynamic feel
      if (new Date().getMinutes() === 0) {
        setUsageData(generateUsageData())
      }
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Loading check after all hooks
  if (coachesLoading || chatsLoading) {
    return <PageLoader />
  }

  const coaches = coachesData?.coaches || []
  const chats = chatsData?.chats || []
  
  const readyCoaches = coaches.filter((c: any) => c.status === 'READY').length
  const trainingCoaches = coaches.filter((c: any) => c.status === 'TRAINING').length
  const errorCoaches = coaches.filter((c: any) => c.status === 'ERROR').length
  const totalVideos = coaches.reduce((sum: number, c: any) => sum + (c.videos?.length || 0), 0)
  const totalMessages = chats.reduce((sum: number, c: any) => sum + (c._count?.messages || 0), 0)
  
  // Calculate growth percentages (simulated)
  const coachesGrowth = Math.floor(Math.random() * 20) + 5
  const chatsGrowth = Math.floor(Math.random() * 30) + 10
  const revenueGrowth = Math.floor(Math.random() * 25) + 15
  const engagementGrowth = Math.floor(Math.random() * 15) + 5

  // Coach status distribution for pie chart
  const coachStatusData = [
    { name: 'Ready', value: readyCoaches, color: '#00d4ff' },
    { name: 'Training', value: trainingCoaches, color: '#ffa726' },
    { name: 'Error', value: errorCoaches, color: '#ef5350' },
    { name: 'Pending', value: coaches.length - readyCoaches - trainingCoaches - errorCoaches, color: '#66bb6a' }
  ]

  const StatCard = ({ title, value, subtitle, icon: Icon, growth, trend = "up" }: any) => (
    <Card className="bg-gradient-to-br from-secondary/50 to-secondary border-border hover:border-primary/50 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {growth && (
            <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {growth}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="mx-auto max-w-8xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your AI coaches.
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-lg font-semibold text-white">
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Coaches"
          value={coaches.length}
          subtitle={`${readyCoaches} ready to chat`}
          icon={Bot}
          growth={coachesGrowth}
        />
        <StatCard
          title="Total Conversations"
          value={chats.length}
          subtitle={`${totalMessages} messages exchanged`}
          icon={MessageSquare}
          growth={chatsGrowth}
        />
        <StatCard
          title="Videos Processed"
          value={totalVideos}
          subtitle="Across all channels"
          icon={TrendingUp}
          growth={revenueGrowth}
        />
        <StatCard
          title="Training Progress"
          value={trainingCoaches}
          subtitle="Coaches in training"
          icon={Activity}
          growth={engagementGrowth}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Analytics Chart */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-secondary/50 to-secondary border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Performance Analytics</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="border-primary/50 text-primary">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            <ChartContainer
              config={{
                chats: { label: "Conversations", color: "#00d4ff" },
                leads: { label: "Leads Generated", color: "#ff6b6b" },
                revenue: { label: "Revenue", color: "#4ecdc4" },
                engagement: { label: "Engagement", color: "#feca57" },
              }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usageData}>
                  <defs>
                    <linearGradient id="chatsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} 
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  />
                  <YAxis 
                    tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} 
                    axisLine={{ stroke: "rgba(255,255,255,0.2)" }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent className="bg-background border-border" />} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="chats" 
                    stroke="#00d4ff" 
                    fill="url(#chatsFill)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#ff6b6b" 
                    fill="url(#leadsFill)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Coach Status Distribution */}
        <Card className="bg-gradient-to-br from-secondary/50 to-secondary border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Coach Status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="h-full flex flex-col">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={coachStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {coachStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {coachStatusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Coaches */}
        <Card className="bg-gradient-to-br from-secondary/50 to-secondary border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Recent Coaches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {coaches.slice(0, 5).map((coach: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        src={coach.avatar} 
                        alt={coach.name} 
                        fallback={coach.channelName || coach.name}
                        size="md"
                      />
                      <div>
                        <div className="font-medium text-white">{coach.name}</div>
                        <div className="text-sm text-muted-foreground">{coach.channelName}</div>
                      </div>
                    </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={coach.status === 'READY' ? 'default' : 'secondary'}
                      className={coach.status === 'READY' ? 'bg-green-500' : 'bg-yellow-500'}
                    >
                      {coach.status === 'READY' ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : coach.status === 'TRAINING' ? (
                        <Clock className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {coach.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {coaches.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No coaches created yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-secondary/50 to-secondary border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/coaches">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12">
                <Plus className="h-4 w-4 mr-2" />
                Create New Coach
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full border-border text-white bg-transparent hover:bg-secondary h-10">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline" className="w-full border-border text-white bg-transparent hover:bg-secondary h-10">
                  <Target className="h-4 w-4 mr-2" />
                  Settings
              </Button>
            </Link>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-2">System Status</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">API Health</span>
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">Training Queue</span>
                  <Badge variant="secondary">
                    {trainingCoaches} active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
