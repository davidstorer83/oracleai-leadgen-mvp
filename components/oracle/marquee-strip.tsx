"use client"

export default function MarqueeStrip() {
  const brands = ["Trusted by creators", "Built for scale", "Privacy-first", "No code setup", "Convert fans faster"]
  return (
    <div className="relative border-y border-[color:var(--border)] bg-[color:var(--muted)] py-3">
      <div className="marquee">
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, pass) => (
            <div key={pass} className="flex items-center gap-10">
              {brands.map((b) => (
                <span key={`${b}-${pass}`} className="text-sm text-[color:var(--muted-foreground)]">
                  {b}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
