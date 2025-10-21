"use client"
import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, PlayCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import HeroAnimated from "@/components/oracle/hero-animated"
import TrustBar from "@/components/oracle/trust-bar"
import FeatureBento from "@/components/oracle/feature-bento"
import Pricing from "@/components/oracle/pricing"
import FAQ from "@/components/oracle/faq"
import Footer from "@/components/oracle/footer"
import MetricsStrip from "@/components/oracle/metrics-strip"
import ScrollSteps from "@/components/oracle/scroll-steps"
import CtaBanner from "@/components/oracle/cta-banner"
import Testimonials from "@/components/oracle/testimonials"

export default function Page() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <main className="min-h-dvh bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-medium tracking-tight text-white">
            OracleAI
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#faq">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user.name || user.email}</span>
                <Link href="/dashboard">
                  <Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff]">
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-white">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-primary text-primary-foreground hover:bg-[#11e1ff]">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <HeroAnimated />


      <section id="how-it-works" className="mx-auto max-w-6xl px-4 mt-16">
        <ScrollSteps />
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 mt-16">
        <FeatureBento />
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-16">
        <Testimonials />
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-16">
        <div className="rounded-xl border border-border bg-secondary p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1">
              <h3 className="text-white font-semibold text-balance">Transform YouTube channels into AI coaches</h3>
              <p className="text-muted-foreground mt-2">
                Upload any YouTube channel URL and get an AI assistant trained on the creator's voice, knowledge, and style.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Automatically extracts transcripts and trains AI</span>
              </div>
            </div>
            <Button variant="outline" className="border-primary/40 text-white hover:bg-secondary bg-transparent">
              <PlayCircle className="mr-2 h-4 w-4 text-primary" />
              Play 60s Demo
            </Button>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 mt-16">
        <Pricing />
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-4 mt-16">
        <FAQ />
      </section>

      <section className="mx-auto max-w-6xl px-4 mt-16 mb-16">
        <CtaBanner />
      </section>

      <Footer />
    </main>
  )
}
