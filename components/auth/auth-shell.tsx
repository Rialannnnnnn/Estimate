import Link from 'next/link'
import type { ReactNode } from 'react'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <main className="relative min-h-screen bg-background text-foreground paper-texture">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(189,235,234,.35),transparent_42%)]" />

      <header className="relative z-10 border-b border-border/70 bg-background/70 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight">EstiMate</span>
            <span className="text-label text-muted-foreground">v1.0</span>
          </Link>
        </div>
      </header>

      <section className="relative z-10 container mx-auto flex flex-col gap-10 px-6 py-16 md:flex-row md:items-start md:justify-between md:py-24">
        <div className="max-w-md">
          <p className="text-label mb-4 text-muted-foreground">{eyebrow}</p>
          <h1 className="text-display text-5xl text-primary text-balance md:text-7xl">{title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground text-pretty">{description}</p>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-border/70 bg-card/85 p-6 shadow-[0_18px_60px_rgba(23,59,88,.07)] backdrop-blur md:p-8">
          {children}
          <div className="mt-6 border-t border-border/70 pt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </section>
    </main>
  )
}
