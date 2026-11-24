import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Sparkles, Wallet, ShoppingBasket, House, Coffee } from 'lucide-react'

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground paper-texture">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,234,242,.7),transparent_42%)]" />
      <div className="pointer-events-none absolute -left-24 top-36 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl animate-pulse [animation-delay:1.2s]" />

      <header className="relative z-10 border-b border-border/70 bg-background/70 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight">EstiMate</span>
            <span className="text-label text-muted-foreground">v1.0</span>
          </Link>
          <span className="hidden items-center gap-2 rounded-full border border-primary/10 bg-card/80 px-3 py-2 text-xs font-medium text-muted-foreground sm:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-sky-600" /> Budget lebih terarah, satu langkah demi satu
          </span>
        </div>
      </header>

      <section className="relative z-10 container mx-auto grid gap-10 px-6 py-10 md:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] md:items-center md:py-16 lg:gap-16">
        <div className="max-w-xl">
          <p className="text-label mb-4 text-muted-foreground">{eyebrow}</p>
          <h1 className="text-display text-5xl text-primary text-balance md:text-6xl lg:text-7xl">{title}</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">{description}</p>

          <div className="relative mt-9 max-w-lg">
            <div className="absolute -left-4 top-8 h-28 w-28 rounded-full bg-sky-200/50 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-[0_18px_60px_rgba(23,59,88,.10)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700"><Wallet className="h-5 w-5" /></span>
                  Contoh budget bulanan
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Simulasi</span>
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500">Anggaran contoh</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Rp2.500.000</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><ArrowDownRight className="h-4 w-4" /> Terkontrol</div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 animate-[budget-fill_2.2s_ease-out_both]" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-sky-50 p-3">
                  <ShoppingBasket className="h-4 w-4 text-sky-700" />
                  <p className="mt-2 text-[11px] text-slate-500">Kebutuhan</p>
                  <p className="text-sm font-bold text-slate-800">Rp1,2 jt</p>
                </div>
                <div className="rounded-2xl bg-violet-50 p-3">
                  <House className="h-4 w-4 text-violet-700" />
                  <p className="mt-2 text-[11px] text-slate-500">Tagihan</p>
                  <p className="text-sm font-bold text-slate-800">Rp800 rb</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3">
                  <Coffee className="h-4 w-4 text-amber-700" />
                  <p className="mt-2 text-[11px] text-slate-500">Harian</p>
                  <p className="text-sm font-bold text-slate-800">Rp500 rb</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-sky-200 px-3 py-2.5 text-xs text-slate-600">
                <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-sky-600" /> AI bantu susun estimasi</span>
                <ArrowUpRight className="h-4 w-4 text-sky-600" />
              </div>
            </div>
            <div className="absolute -right-3 -top-4 hidden animate-bounce rounded-2xl border border-white bg-white p-3 text-xs font-semibold text-sky-800 shadow-lg sm:block">
              ✨ Rencana lebih rapi!
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Angka di atas hanya ilustrasi, bukan data akun atau rekomendasi keuangan.</p>
        </div>

        <div className="w-full max-w-md justify-self-center rounded-3xl border border-border/70 bg-card/90 p-6 shadow-[0_18px_60px_rgba(23,59,88,.09)] backdrop-blur md:p-8">
          {children}
          <div className="mt-6 border-t border-border/70 pt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </section>
      <style>{`@keyframes budget-fill { from { width: 0 } to { width: 62% } }`}</style>
    </main>
  )
}
