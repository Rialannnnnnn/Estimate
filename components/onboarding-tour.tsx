'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, BookOpen, Check, X, Sparkles } from 'lucide-react'

type Step = { title: string; description: string; target: string | null; action: string; center?: boolean }

const dashboardSteps: Step[] = [
  { title: 'Selamat datang di EstiMate! 👋', description: 'Senang kamu bergabung! Di sini kita akan membuat rencana budget pertamamu. Tenang, kamu bisa langsung mencoba setiap bagian—panduan ini tidak mengunci layar.', target: null, action: 'Ayo mulai!', center: true },
  { title: 'Mulai dari sini', description: 'Tekan tombol “Rencana Budget Baru”. Lihat efek cahaya di sekeliling tombol? Itu tanda bagian yang perlu kamu coba.', target: 'new-budget', action: 'Sudah dibuka' },
  { title: 'Pilih kebutuhan yang paling cocok', description: 'Ada beberapa pilihan dari Kebutuhan Harian Dasar sampai Target Menabung. Pilih salah satu saja. Semua kotak akan disorot agar kamu bisa melihat pilihannya.', target: 'template-card', action: 'Sudah memilih' },
  { title: 'Tentukan batas dan nama rencanamu', description: 'Isi dua bagian penting ini: BATAS BUDGET KAMU dan NAMA RENCANA BUDGET. Batas budget adalah batas pengeluaran yang ingin kamu jaga, sedangkan nama membantu membedakan rencana. Setelah itu, tekan tombol “Buat Rencana” pada formulir (bukan tombol panduan) untuk membuka ruang AI.', target: 'budget-fields', action: 'Lanjut ke AI' },
  { title: 'Kenalan dengan AI EstiMate ✨', description: 'Setelah menekan Buat Rencana, kamu akan masuk ke ruang ngobrol dengan AI. Ceritakan kebutuhanmu dengan bahasa sehari-hari—misalnya “aku anak kos, butuh budget makan dan transportasi selama sebulan”. AI membantu menyusun daftar kebutuhan dan estimasi awal berdasarkan konteksmu.', target: 'ai-generator', action: 'Mengerti, lanjut' },
  { title: 'Daftar kebutuhan bisa kamu atur sendiri', description: 'Hasil AI bukan aturan yang kaku. Kamu bisa mengubah nama barang, jumlah, kategori, dan harga; menghapus item yang tidak perlu; atau menambahkan kebutuhan secara manual sebelum menyimpan rencana.', target: 'ai-generator', action: 'Lanjut' },
  { title: 'Rencana pertamamu sudah tersimpan 🎉', description: 'Sekarang lihat kartu proyek yang baru dibuat di bagian Rencana Budgetmu. Klik kartu tersebut untuk membuka detail rencanamu.', target: 'project-card', action: 'Sudah membuka proyek' },
]

const projectSteps: Step[] = [
  { title: 'Ringkasan budget kamu', description: 'Bagian ini menunjukkan status anggaran secara keseluruhan. Persentase memperlihatkan seberapa besar proyeksi kebutuhan dibanding batas budget. Angka sisa membantu kamu melihat ruang anggaran yang masih tersedia.', target: 'budget-indicator', action: 'Lanjut' },
  { title: 'Tiga angka yang perlu dipahami', description: 'ESTIMASI adalah total perkiraan dari daftar kebutuhan. REALISASI adalah total harga aktual dari barang yang sudah dibeli dan dicatat. DIBELI menunjukkan jumlah item yang sudah ditandai dibeli dibanding seluruh item.', target: 'project-stats', action: 'Lanjut' },
  { title: 'Diagram pengeluaran 📊', description: 'Diagram ini mengelompokkan kebutuhan berdasarkan kategori. Pilih Estimasi untuk melihat rencana biaya seluruh item, atau Realisasi untuk melihat biaya aktual dari barang yang sudah dibeli dan memiliki harga asli. Besar irisan menunjukkan proporsi tiap kategori.', target: 'expense-chart', action: 'Lanjut' },
  { title: 'Daftar kebutuhan', description: 'Di sini semua item ditampilkan. Kamu bisa mengubah jumlah dan estimasi harga, menandai barang sudah dibeli, lalu mengisi harga aktual. Gunakan tombol Tambah untuk memasukkan kebutuhan baru secara manual, atau ikon hapus untuk menghapus item.', target: 'materials-list', action: 'Selesai tur' },
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
  useEffect(() => { setStepIndex(0) }, [isProjectPage])
  const [rects, setRects] = useState<DOMRect[]>([])
  const [cardPosition, setCardPosition] = useState<{ top: number; left: number } | null>(null)
  const current = steps[Math.min(stepIndex, steps.length - 1)]

  const updateTargets = useCallback(() => {
    if (!open || !current?.target) {
      setRects([])
      setCardPosition(null)
      return
    }
    const elements = findTargets(current.target)
    const nextRects = elements.map((element) => element.getBoundingClientRect()).filter((rect) => rect.width > 0 && rect.height > 0)
    setRects(nextRects)
    if (!nextRects.length) {
      setCardPosition(null)
      return
    }

    const leftEdge = Math.min(...nextRects.map((rect) => rect.left))
    const rightEdge = Math.max(...nextRects.map((rect) => rect.right))
    const topEdge = Math.min(...nextRects.map((rect) => rect.top))
    const bottomEdge = Math.max(...nextRects.map((rect) => rect.bottom))
    const width = 360
    const height = 320
    const gap = 18
    let left = rightEdge + gap
    let top = topEdge

    if (left + width > window.innerWidth - 16) left = leftEdge - width - gap
    if (left < 16) {
      left = Math.max(16, Math.min(leftEdge, window.innerWidth - width - 16))
      top = bottomEdge + gap
      if (top + height > window.innerHeight - 16) top = Math.max(16, topEdge - height - gap)
    }
    top = Math.max(16, Math.min(top, window.innerHeight - height - 16))
    left = Math.max(16, Math.min(left, window.innerWidth - width - 16))
    setCardPosition({ top, left })
  }, [open, current])

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      setRects([])
      return
    }
    if (isProjectPage && stepIndex < 0) setStepIndex(0)
    const elements = findTargets(current?.target ?? null)
    elements[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const frame = window.requestAnimationFrame(updateTargets)
    const timer = window.setTimeout(updateTargets, 350)
    window.addEventListener('resize', updateTargets)
    window.addEventListener('scroll', updateTargets, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      window.removeEventListener('resize', updateTargets)
      window.removeEventListener('scroll', updateTargets, true)
    }
  }, [open, current, updateTargets, isProjectPage, stepIndex])

  useEffect(() => {
    if (open && isProjectPage && stepIndex === 0) setStepIndex(0)
  }, [open, isProjectPage])

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
      : { top: 'auto', right: 16, bottom: 16 }

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <style>{`
        @keyframes tour-glow { 0%,100% { box-shadow: 0 0 0 3px rgba(14,165,233,.22), 0 0 12px 4px rgba(14,165,233,.35); } 50% { box-shadow: 0 0 0 7px rgba(14,165,233,.12), 0 0 28px 10px rgba(14,165,233,.55); } }
        .tour-highlight { border-radius: 16px; outline: 3px solid #0ea5e9; outline-offset: 4px; animation: tour-glow 1.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .tour-highlight { animation: none; } }
      `}</style>
      {rects.map((rect, index) => (
        <div key={index} aria-hidden="true" className="pointer-events-none fixed rounded-2xl border-2 border-sky-400 tour-highlight"
          style={{ top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10 }} />
      ))}

      <section role="dialog" aria-modal="false" aria-labelledby="onboarding-title"
        className={`pointer-events-auto fixed w-[min(360px,calc(100vw-32px))] max-h-[calc(100vh-32px)] overflow-y-auto rounded-3xl border border-sky-200 bg-white/95 p-5 text-slate-900 shadow-[0_18px_60px_rgba(15,23,42,.24)] backdrop-blur-md transition-all duration-300 ${isWelcome ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
        style={cardStyle}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100"><BookOpen className="h-5 w-5" /></span>
            Panduan EstiMate
          </div>
          <button onClick={finish} aria-label="Tutup panduan" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-3 flex items-center gap-1.5">
          {steps.map((step, index) => <span key={step.title} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= stepIndex ? 'bg-sky-600' : 'bg-slate-200'}`} />)}
        </div>
        <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sky-700">
          <Sparkles className="h-3 w-3" /> Langkah {stepIndex + 1} / {steps.length}
        </p>
        <h2 id="onboarding-title" className="text-lg font-bold tracking-tight">{current.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish} className="rounded-full text-slate-600">Tutup panduan</Button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && <Button variant="outline" size="sm" onClick={back} className="rounded-full"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Kembali</Button>}
            <Button size="sm" onClick={next} className="rounded-full bg-sky-700 text-white hover:bg-sky-800">
              {stepIndex === steps.length - 1 ? <><Check className="mr-1 h-4 w-4" /> {current.action}</> : <>{current.action} <ArrowRight className="ml-1 h-3.5 w-3.5" /></>}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
