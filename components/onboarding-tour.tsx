'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, BookOpen, Check, X } from 'lucide-react'

type Step = {
  title: string
  description: string
  target: 'new-budget' | 'template' | 'budget' | 'projects' | null
  action: string
}

const steps: Step[] = [
  {
    title: 'Selamat datang di EstiMate!',
    description: 'Kita belajar sambil mencoba langsung. Panduan ini tidak mengunci layar—kamu tetap bisa klik, mengetik, dan menjelajahi dashboard kapan saja.',
    target: null,
    action: 'Mulai tur',
  },
  {
    title: 'Coba buat rencana budget',
    description: 'Klik tombol “Rencana Budget Baru” di halaman. Setelah formulir terbuka, kembali ke panduan ini lalu tekan Lanjut.',
    target: 'new-budget',
    action: 'Formulir sudah terbuka',
  },
  {
    title: 'Pilih contoh kebutuhan',
    description: 'Klik salah satu template yang paling dekat dengan kebutuhanmu. Coba lihat pilihan yang tersedia—kamu bisa menggantinya nanti.',
    target: 'template',
    action: 'Sudah pilih template',
  },
  {
    title: 'Isi budget dan nama rencana',
    description: 'Coba isi periode, batas budget, dan nama rencana pada formulir di samping/atas. Angka contoh hanya titik awal dan bisa kamu ubah.',
    target: 'budget',
    action: 'Sudah mencoba mengisi',
  },
  {
    title: 'Lihat daftar rencanamu',
    description: 'Setelah membuat rencana, semua rencana tersimpan di bagian ini. Kamu juga bisa membuka rencana contoh yang sudah ada untuk mencoba fitur tanpa harus membuat data baru.',
    target: 'projects',
    action: 'Lanjut',
  },
  {
    title: 'Sekarang giliranmu!',
    description: 'Di dalam rencana, coba ubah jumlah item, tandai barang yang sudah dibeli, lalu catat harga aktual. Estimasi AI bisa kamu koreksi kapan saja. Panduan ini bisa dibuka lagi lewat tombol Panduan.',
    target: null,
    action: 'Selesai',
  },
]

function resolveTarget(target: Step['target']): HTMLElement | null {
  if (!target) return null
  if (target === 'new-budget') {
    return Array.from(document.querySelectorAll('button')).find((element) =>
      element.textContent?.includes('Rencana Budget Baru')
    ) as HTMLElement ?? null
  }
  if (target === 'template') {
    return document.querySelector('.cursor-pointer.transition-all') as HTMLElement | null
  }
  if (target === 'budget') {
    return document.querySelector('#budget-limit')?.parentElement as HTMLElement | null
  }
  const label = Array.from(document.querySelectorAll('span')).find((element) =>
    element.textContent?.trim() === 'Rencana Budgetmu'
  )
  return label?.closest('section') as HTMLElement | null
}

type Props = { open: boolean; onClose: () => void }

export function OnboardingTour({ open, onClose }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const current = steps[stepIndex]

  const updateRect = useCallback(() => {
    if (!open || !current?.target) {
      setRect(null)
      return
    }
    const element = resolveTarget(current.target)
    setRect(element ? element.getBoundingClientRect() : null)
  }, [open, current])

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      setRect(null)
      return
    }
    const element = resolveTarget(current.target)
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const frame = window.requestAnimationFrame(updateRect)
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('click', updateRect, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('click', updateRect, true)
    }
  }, [open, current, updateRect])

  if (!open) return null

  const finish = () => {
    setStepIndex(0)
    onClose()
  }
  const next = () => {
    if (stepIndex === steps.length - 1) finish()
    else setStepIndex((index) => index + 1)
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl border-2 border-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.12)] transition-all duration-300"
          style={{
            top: rect.top - 5,
            left: rect.left - 5,
            width: rect.width + 10,
            height: rect.height + 10,
          }}
        />
      )}

      <section
        role="region"
        aria-labelledby="onboarding-title"
        className="pointer-events-auto fixed bottom-4 right-4 w-[min(390px,calc(100vw-32px))] rounded-3xl border border-sky-200 bg-white/95 p-5 text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,.22)] backdrop-blur-md sm:bottom-6 sm:right-6"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
              <BookOpen className="h-5 w-5" />
            </span>
            Panduan sambil mencoba
          </div>
          <button onClick={finish} aria-label="Tutup tutorial" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-1.5">
          {steps.map((step, index) => (
            <span key={step.title} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= stepIndex ? 'bg-sky-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">
          Langkah {stepIndex + 1} / {steps.length}
        </p>
        <h2 id="onboarding-title" className="text-lg font-bold tracking-tight">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.description}</p>
        {current.target && !rect && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Bagian yang dituju belum terlihat. Kamu bisa gulir halaman untuk menemukannya.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish} className="rounded-full text-slate-600">
            Tutup panduan
          </Button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStepIndex((index) => Math.max(0, index - 1))} className="rounded-full">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Kembali
              </Button>
            )}
            <Button size="sm" onClick={next} className="rounded-full bg-sky-700 text-white hover:bg-sky-800">
              {stepIndex === steps.length - 1
                ? <><Check className="mr-1 h-4 w-4" /> {current.action}</>
                : <>{current.action} <ArrowRight className="ml-1 h-3.5 w-3.5" /></>}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
