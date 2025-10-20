"use client"

import type React from "react"
import { Sidebar } from "@/components/oracle/sidebar"
import { TopNav } from "@/components/oracle/topnav"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { PageLoader } from "@/components/ui/loader"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <PageLoader />
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-dvh flex">
      <aside className="hidden md:block fixed left-0 top-0 h-full w-60 border-r border-border bg-sidebar z-10">
        <Sidebar />
      </aside>
      <div className="flex-1 md:ml-60 flex min-h-dvh flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
