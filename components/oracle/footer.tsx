import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>© {new Date().getFullYear()} OracleAI</div>
        <nav className="flex items-center gap-4">
          <Link href="#pricing">Pricing</Link>
          <Link href="#faq">FAQ</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </div>
    </footer>
  )
}
