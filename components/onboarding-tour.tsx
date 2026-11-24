'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, BookOpen, Check, X } from 'lucide-react'

type Step = { title: string; description: string; target: string | null; action: string; center?: boolean }

const dashboardSteps: Step[] = [
  { title: 'Selamat datang di EstiMate!', description: 'Yuk, buat rencana budget pertamamu.', target: null, action: 'Mulai' , center: true },
  { title: 'Buat rencana baru', description: 'Tekan tombol ini untuk memulai.', target: 'new-budget', action: 'Lanjut' },
  { title: 'Pilih template', description: 'Pilih satu dari 10 template yang paling sesuai.', target: 'template-grid', action: 'Lanjut' },
  { title: 'Isi batas budget dan nama rencana', description: 'Tentukan batas pengeluaran dan beri nama rencanamu.', target: 'budget-inputs', action: 'Lanjut' },
  { title: 'Buka AI EstiMate', description: 'Tekan “Buat Rencana” untuk mulai menyusun kebutuhan bersama AI.', target: 'create-budget', action: 'Sudah dibuka' },
  { title: 'Ceritakan kebutuhanmu', description: 'Ceritakan kebutuhanmu. AI akan membantu membuat daftar dan estimasi biaya.', target: 'ai-generator', action: 'Lanjut' },
  { title: 'Atur hasil AI', description: 'Periksa hasilnya. Kamu bisa mengubah, menghapus, atau menambah item sendiri.', target: 'ai-generator', action: 'Lanjut' },
  { title: 'Buka rencanamu', description: 'Setelah disimpan, pilih kartu proyek ini untuk melihat detailnya.', target: 'project-card', action: 'Buka proyek' },
]

const projectSteps: Step[] = [
  { title: 'Status anggaran', description: 'Lihat apakah rencanamu masih aman atau melewati batas.', target: 'budget-indicator', action: 'Lanjut' },
  { title: 'Ringkasan pengeluaran', description: 'Estimasi = perkiraan. Realisasi = biaya aktual. Dibeli = item yang sudah dibeli.', target: 'project-stats', action: 'Lanjut' },
  { title: 'Diagram pengeluaran', description: 'Lihat pembagian biaya tiap kategori. Ganti Estimasi atau Realisasi untuk membandingkan.', target: 'expense-chart', action: 'Lanjut' },
  { title: 'Daftar kebutuhan', description: 'Ubah item, tandai sudah dibeli, isi harga aktual, atau tambah kebutuhan baru.', target: 'materials-list', action: 'Selesai' },
]

function findTargets(key: string | null): HTMLElement[] {
  if (!key) return []
  return Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`))
}

type Props = { open: boolean; onClose: () => void }

export function OnboardingTour({ open, onClose }: Props) {
  const pathname = usePathname()
  const isProjectPage = pathname.startsWith('/dashboard/project/')
  const steps = isProjectPage ? projectSteps : dashboardSteps
  const [stepIndex, setStepIndex] = useState(0)
  const [rects, setRects] = useState<DOMRect[]>([])
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null)
  const current = steps[Math.min(stepIndex, steps.length - 1)]

  useEffect(() => { setStepIndex(0) }, [isProjectPage])

  const updateTargets = useCallback(() => {
    if (!open || !current?.target) {
      setRects([])
      setCardPosition(null)
      return
    }
    const elements = findTargets(current.target)
    const visible = elements.filter((el) => {
      const style = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
    })
    const nextRects = visible.map((el) => el.getBoundingClientRect())
    setRects(nextRects)
    if (!nextRects.length) {
      setCardPosition(null)
      return
    }

    const leftEdge = Math.min(...nextRects.map((r) => r.left))
    const rightEdge = Math.max(...nextRects.map((r) => r.right))
    const topEdge = Math.min(...nextRects.map((r) => r.top))
    const bottomEdge = Math.max(...nextRects.map((r) => r.bottom))
    const width = Math.min(360, window.innerWidth - 32)
    const estimatedHeight = Math.min(280, window.innerHeight * 0.62)
    const gap = 16
    let left = rightEdge + gap
    let top = topEdge

    if (left + width > window.innerWidth - 16) left = leftEdge - width - gap
    if (left < 16) {
      left = Math.max(16, Math.min(window.innerWidth - width - 16, leftEdge))
      const roomBelow = window.innerHeight - bottomEdge - gap
      const roomAbove = topEdge - gap
      top = roomBelow >= Math.min(estimatedHeight, 220) || roomBelow >= roomAbove
        ? bottomEdge + gap
        : topEdge - estimatedHeight - gap
    }
    top = Math.max(16, Math.min(top, window.innerHeight - estimatedHeight - 16))
    left = Math.max(16, Math.min(left, window.innerWidth - width - 16))
    setCardPosition({ top, left })
  }, [open, current])

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      setRects([])
      return
    }
    const elements = findTargets(current?.target ?? null)
    elements[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const frame = window.requestAnimationFrame(updateTargets)
    const timer = window.setTimeout(updateTargets, 450)
    window.addEventListener('resize', updateTargets)
    window.addEventListener('scroll', updateTargets, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      window.removeEventListener('resize', updateTargets)
      window.removeEventListener('scroll', updateTargets, true)
    }
  }, [open, current, updateTargets])

  if (!open) return null

  const finish = () => {
    setStepIndex(0)
    onClose()
  }
  const next = () => {
    if (stepIndex >= steps.length - 1) finish()
    else setStepIndex((value) => value + 1)
  }
  const back = () => setStepIndex((value) => Math.max(0, value - 1))

  const isWelcome = current.center
  const cardStyle = isWelcome
    ? undefined
    : cardPosition
      ? { top: cardPosition.top, left: cardPosition.left }
      : { right: 16, bottom: 16 }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <style>{`
        .tour-highlight {
          border-radius: 14px;
          border: 1px solid rgba(23, 63, 95, .34);
          box-shadow: 0 0 0 4px rgba(23, 63, 95, .09), 0 8px 24px rgba(23, 63, 95, .13);
          background: rgba(23, 63, 95, .025);
        }
        @media (prefers-reduced-motion: reduce) { .tour-highlight { animation: none; } }
      `}</style>
      {rects.map((rect, index) => (
        <div key={index} aria-hidden="true" className="pointer-events-none fixed tour-highlight"
          style={{ top: rect.top - 3, left: rect.left - 3, width: rect.width + 6, height: rect.height + 6 }} />
      ))}

      <section role="dialog" aria-modal="false" aria-labelledby="onboarding-title"
        className={`pointer-events-auto fixed flex max-h-[min(70vh,520px)] w-[min(360px,calc(100vw-32px))] flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_12px_36px_rgba(15,35,55,.18)] transition-all duration-200 ${isWelcome ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
        style={cardStyle}>
        <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#173f5f]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100"><BookOpen className="h-4 w-4" /></span>
            <span>Panduan EstiMate</span>
          </div>
          <button onClick={finish} aria-label="Tutup panduan" className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-3 flex shrink-0 items-center gap-1.5">
          {steps.map((step, index) => <span key={step.title} className={`h-1.5 min-w-0 flex-1 rounded-full ${index <= stepIndex ? 'bg-[#173f5f]' : 'bg-slate-200'}`} />)}
        </div>
        <p className="mb-1 shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#173f5f]">Langkah {stepIndex + 1} / {steps.length}</p>
        <h2 id="onboarding-title" className="shrink-0 text-base font-bold leading-snug">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.description}</p>
        <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <Button variant="ghost" size="sm" onClick={finish} className="rounded-full px-2 text-xs text-slate-600">Tutup</Button>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            {stepIndex > 0 && <Button variant="outline" size="sm" onClick={back} className="rounded-full px-3 text-xs"><ArrowLeft className="mr-1 h-3 w-3" /> Kembali</Button>}
            <Button size="sm" onClick={next} className="rounded-full bg-[#173f5f] px-3 text-xs text-white hover:bg-[#102f49]">
              {stepIndex === steps.length - 1 ? <><Check className="mr-1 h-3.5 w-3.5" /> {current.action}</> : <>{current.action} <ArrowRight className="ml-1 h-3 w-3" /></>}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
