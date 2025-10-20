"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, BarChart3, Settings, Users2, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { User, LogOut } from "lucide-react"
import { useEffect, useState } from "react"

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/coaches", label: "Coaches", icon: Bot },
  { href: "/dashboard/leads", label: "Leads", icon: Users2 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  // { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="h-full flex flex-col p-4 overflow-y-auto">
      <div className="mb-6 text-white font-medium text-lg">OracleAI</div>
      
      <nav className="space-y-1 flex-1 overflow-y-auto">
        {items.map((it) => {
          const active = pathname === it.href
          const Icon = it.icon
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-white hover:bg-sidebar-accent transition-colors",
                active && "bg-sidebar-accent text-white",
              )}
            >
              <Icon className="h-4 w-4 text-primary" />
              <span>{it.label}</span>
            </Link>
          )
        })}
      </nav>

        {isClient && user && (
          <div className="mt-auto pt-4 border-t border-border flex-shrink-0">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Avatar 
                  fallback={user.name || user.email}
                  size="md"
                />
                <span className="truncate">{user.name || user.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-white justify-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
    </div>
  )
}
