'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground paper-texture">
      {/* Soft atmosphere */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(189,235,234,.35),transparent_42%)] pointer-events-none" />
      
      {/* Header - Minimal */}
      <header className="relative z-10 border-b border-border/70 bg-background/70 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight">EstiMate</span>
            <span className="text-label text-muted-foreground">v1.0</span>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="border border-primary/20 bg-card text-primary hover:bg-secondary font-semibold rounded-full">
              Buka EstiMate
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section - Neubau Style */}
      <section className="relative z-10 pt-20 md:pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Large Display Typography */}
          <div className="max-w-6xl">
            <div className="text-label text-muted-foreground mb-6">
              <span>Untuk Remaja & Dewasa Muda</span>
              <span className="mx-2">/</span>
              <span>Budget Harian</span>
              <span className="mx-2">/</span>
              <span>Lebih Terkontrol</span>
            </div>
            
            <h1 className="text-display text-6xl md:text-8xl lg:text-[9rem] text-primary mb-8 max-w-4xl">
              Stop
              <br />
              Over
              <br />
              budget.
            </h1>
            
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="space-y-4">
                <p className="text-xl md:text-2xl text-primary/90 leading-relaxed">
                  Tools budgeting yang membantu menentukan kebutuhan harian dan bulanan sebelum uangmu habis.
                </p>
                <p className="text-muted-foreground">
                  Makan, transportasi, tagihan, hiburan, dan tabungan. Susun prioritas belanja dengan lebih tenang.
                </p>
              </div>
              <div className="flex flex-col justify-end items-start md:items-end">
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 border border-primary text-lg px-8 font-semibold rounded-full">
                Mulai Budgeting
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement - Technical Style */}
      <section className="relative z-10 py-12 border-t border-b border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-2">
              <span className="text-label text-muted-foreground">Problem</span>
            </div>
            <div className="md:col-span-10">
              <p className="text-2xl md:text-3xl font-bold text-primary">
                Belanja kecil yang tidak dicatat bisa membuat budget bulananmu bocor.
              </p>
              <p className="text-muted-foreground mt-2">Kamu tidak sendirian.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Grid Layout */}
      <section className="relative z-10 py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-6 mb-12">
            <div className="md:col-span-2">
              <span className="text-label text-muted-foreground">Fitur</span>
            </div>
            <div className="md:col-span-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-primary">
                Dirancang untuk
                <br />
                Remaja & Dewasa Muda
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50">
            {[
              {
                num: '01',
                title: 'Template Proyek',
                desc: 'Pilih template harian, anak kos, tagihan, transportasi, atau target menabung. Daftar kebutuhan langsung muncul dengan estimasi biaya.'
              },
              {
                num: '02',
                title: 'Kalkulator Dinamis',
                desc: 'Total otomatis terupdate. Indikator visual berubah sesuai status budget.'
              },
              {
                num: '03',
                title: 'Checklist Belanja',
                desc: 'Centang saat belanja, input harga asli. Lihat sisa uang secara real-time di toko.'
              },
              {
                num: '04',
                title: 'Tanpa Akun',
                desc: 'Data tersimpan otomatis di browser. Buka di Safari/Chrome, langsung lanjut kerja.'
              }
            ].map((feature) => (
              <div key={feature.num} className="bg-card/80 p-8 border border-border/70 rounded-2xl shadow-[0_14px_40px_rgba(23,59,88,.05)]">
                <span className="text-mono-sm text-muted-foreground">{feature.num}</span>
                <h3 className="text-xl font-bold text-card-foreground mt-4 mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Large Numbers */}
      <section className="relative z-10 py-16 md:py-24 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-6 mb-16">
            <div className="md:col-span-2">
              <span className="text-label text-muted-foreground">Cara Kerja</span>
            </div>
            <div className="md:col-span-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-primary">
                3 Langkah Mudah
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                num: '1',
                title: 'Pilih Template',
                desc: 'Pilih kebutuhan harian, bulanan, anak kos, atau target keuanganmu'
              },
              {
                num: '2',
                title: 'Set Batas Dana',
                desc: 'Masukkan budget maksimal. Sistem akan memberi peringatan visual jika melebihi'
              },
              {
                num: '3',
                title: 'Belanja & Centang',
                desc: 'Centang kebutuhan saat terpenuhi dan masukkan harga asli untuk melihat sisa budget real-time'
              }
            ].map((step) => (
              <div key={step.num} className="relative">
                <span className="text-display text-[8rem] md:text-[12rem] text-primary/10 absolute -top-8 -left-4 select-none">
                  {step.num}
                </span>
                <div className="relative pt-24">
                  <h3 className="text-2xl font-bold text-primary mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Budget Status Demo - Specimen Style */}
      <section className="relative z-10 py-16 md:py-24 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-6 mb-12">
            <div className="md:col-span-2">
              <span className="text-label text-muted-foreground">Status</span>
            </div>
            <div className="md:col-span-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-primary">
                Indikator Visual
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border/50">
            <div className="bg-success p-8 text-success-foreground">
              <span className="text-mono-sm opacity-70">STATUS_SAFE</span>
              <h3 className="text-display text-4xl md:text-5xl mt-4">Aman</h3>
              <p className="mt-4 opacity-80">Di bawah 80% batas dana</p>
              <div className="mt-6 font-mono text-lg">
                Rp 400.000 / 500.000
              </div>
            </div>
            
            <div className="bg-warning p-8 text-warning-foreground">
              <span className="text-mono-sm opacity-70">STATUS_WARNING</span>
              <h3 className="text-display text-4xl md:text-5xl mt-4">Limit</h3>
              <p className="mt-4 opacity-80">80-100% dari batas dana</p>
              <div className="mt-6 font-mono text-lg">
                Rp 450.000 / 500.000
              </div>
            </div>
            
            <div className="bg-danger p-8 text-danger-foreground">
              <span className="text-mono-sm opacity-70">STATUS_OVER</span>
              <h3 className="text-display text-4xl md:text-5xl mt-4">Over</h3>
              <p className="mt-4 opacity-80">Melebihi batas dana</p>
              <div className="mt-6 font-mono text-lg">
                Rp 550.000 / 500.000
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Bold */}
      <section className="relative z-10 py-24 md:py-32 border-t border-border/70 bg-secondary/35">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <h2 className="text-display text-5xl md:text-7xl text-primary mb-8">
              Mulai Sekarang
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-xl">
              Mulai dari kebutuhan yang paling penting. Buat rencana anggaran pertamamu dan cegah pengeluaran berlebih.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xl px-10 font-bold h-16">
                Buat Rencana Anggaran
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Technical */}
      <footer className="relative z-10 py-8 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-label text-muted-foreground">Title</span>
              <span className="ml-2 font-bold text-primary">EstiMate</span>
            </div>
            <div>
              <span className="text-label text-muted-foreground">Year</span>
              <span className="ml-2 font-bold text-primary">2025</span>
            </div>
            <div>
              <span className="text-label text-muted-foreground">For</span>
              <span className="ml-2 font-bold text-primary">Remaja & Dewasa Muda Indonesia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
