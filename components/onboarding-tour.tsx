'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, BookOpen, Check, X } from 'lucide-react'

type Step = {
  title: string
  description: string
  target: 'new-budget' | 'template' | 'budget' | 'projects' | null
  placement?: 'top' | 'bottom'
}

const steps: Step[] = [
  {
    title: 'Selamat datang di EstiMate!',
    description: 'EstiMate membantu kamu menyusun rencana pengeluaran, memperkirakan kebutuhan dengan AI, lalu membandingkan estimasi dengan pengeluaran sebenarnya. Yuk, kenali alurnya dalam beberapa langkah.',
    target: null,
  },
  {
    title: 'Mulai dari rencana budget',
    description: 'Klik tombol “Rencana Budget Baru” yang disorot. Kamu bisa membuat rencana harian, bulanan, atau sesuai kebutuhan.',
    target: 'new-budget',
    placement: 'bottom',
  },
  {
    title: 'Pilih template kebutuhan',
    description: 'Pilih template yang paling mendekati kebutuhanmu. Template hanya titik awal—daftar item dan nominalnya tetap bisa kamu sesuaikan.',
    target: 'template',
    placement: 'bottom',
  },
  {
    title: 'Atur batas budget dan nama rencana',
    description: 'Tentukan periode, batas anggaran, dan nama rencanamu. Setelah itu, EstiMate akan membantumu menyusun daftar kebutuhan dengan AI.',
    target: 'budget',
    placement: 'top',
  },
  {
    title: 'Pantau semua rencana budget',
    description: 'Rencana yang sudah dibuat akan tersimpan di bagian ini. Buka salah satu rencana untuk melihat estimasi, realisasi belanja, dan progres anggaran.',
    target: 'projects',
    placement: 'top',
  },
  {
    title: 'Kamu siap mulai!',
    description: 'Di dalam rencana, kamu bisa meminta AI menyusun kebutuhan, mengubah item dan jumlah, menandai barang yang sudah dibeli, lalu mencatat harga aktual. Ingat, prediksi AI adalah estimasi yang tetap bisa kamu koreksi.',
    target: null,
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

type Props = {
  open: boolean
  onClose: () => void
}

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
    if (stepIndex === steps.length - 1) {
      finish()
      return
    }
    setStepIndex((index) => index + 1)
  }

  const tooltipStyle = rect
    ? (() => {
        const cardWidth = Math.min(420, window.innerWidth - 32)
        return {
          top: current.placement === 'top'
            ? Math.max(16, rect.top - 250)
            : Math.min(window.innerHeight - 260, rect.bottom + 16),
          left: Math.max(16, Math.min(rect.left + rect.width / 2 - cardWidth / 2, window.innerWidth - cardWidth - 16)),
          width: cardWidth,
        }
      })()
    : undefined

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]" />
      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl border-2 border-sky-300 shadow-[0_0_0_9999px_rgba(2,6,23,0.68),0_0_0_6px_rgba(125,211,252,0.22)] transition-all duration-200"
          style={{
            top: rect.top - 7,
            left: rect.left - 7,
            width: rect.width + 14,
            height: rect.height + 14,
          }}
        />
      )}

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className={`pointer-events-auto absolute w-[min(420px,calc(100vw-32px))] rounded-3xl border border-sky-100/30 bg-white p-6 text-slate-900 shadow-2xl ${rect ? '' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}
        style={tooltipStyle}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
              <BookOpen className="h-5 w-5" />
            </span>
            Panduan EstiMate
          </div>
          <button onClick={finish} aria-label="Tutup tutorial" className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-1.5" aria-label={`Langkah ${stepIndex + 1} dari ${steps.length}`}>
          {steps.map((step, index) => (
            <span key={step.title} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? 'bg-sky-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
          Langkah {stepIndex + 1} dari {steps.length}
        </p>
        <h2 id="onboarding-title" className="text-xl font-bold tracking-tight">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.description}</p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={finish} className="rounded-full text-slate-600 hover:text-slate-900">
            Lewati
          </Button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button variant="outline" onClick={() => setStepIndex((index) => Math.max(0, index - 1))} className="rounded-full">
                <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
              </Button>
            )}
            <Button onClick={next} className="rounded-full bg-sky-700 text-white hover:bg-sky-800">
              {stepIndex === steps.length - 1
                ? <><Check className="mr-1 h-4 w-4" /> Selesai</>
                : <>Lanjut <ArrowRight className="ml-1 h-4 w-4" /></>}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
