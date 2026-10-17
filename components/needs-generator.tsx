'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Check, Info, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Material } from '@/lib/types'
import type { TemplateType } from '@/lib/templates'
import { analyzeBudget, generateRecommendations, itemTotal, type DetectedContext, type Priority } from '@/lib/recommendations'

type Props = {
  period: 'daily' | 'monthly'
  templateType?: TemplateType | null
  budgetLimit?: number | null
  isExampleBudget?: boolean
  initialCriteria: string
  initialItems: Material[]
  onConfirm: (items: Material[]) => void
  onBack: () => void
}

type ReviewItem = Material & { priority?: Priority; reason?: string }

const rupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`

export function NeedsGenerator({ period, templateType, budgetLimit, isExampleBudget = false, initialCriteria, initialItems, onConfirm, onBack }: Props) {
  const [criteria, setCriteria] = useState(initialCriteria)
  const [items, setItems] = useState<ReviewItem[]>(initialItems)
  const [contexts, setContexts] = useState<DetectedContext[]>([])
  const [usedFallback, setUsedFallback] = useState(false)

  const budget = budgetLimit && budgetLimit > 0 ? budgetLimit : null
  const analysis = useMemo(() => analyzeBudget(items, budget), [items, budget])
  const total = analysis.total

  const update = (index: number, patch: Partial<ReviewItem>) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  const addItem = () => setItems((current) => [...current, { id: `custom-${Date.now()}`, name: 'Kebutuhan baru', category: 'Lainnya · unit', quantity: 1, unitPrice: 0, actualPrice: null, isPurchased: false, priority: 'essential', reason: 'ditambahkan manual' }])
  const applySuggestion = (id: string, kind: 'remove' | 'reduce', newQuantity?: number) => {
    setItems((current) => kind === 'remove'
      ? current.filter((item) => (item.id ?? item.name) !== id)
      : current.map((item) => (item.id ?? item.name) === id && newQuantity && newQuantity >= 1
        ? { ...item, quantity: newQuantity }
        : item))
  }
  const runGenerate = () => {
    const result = generateRecommendations({ description: criteria, period, templateType })
    setItems(result.items)
    setContexts(result.contexts)
    setUsedFallback(result.usedFallback)
  }

  return (
    <section className="border border-border/70 bg-card/90 rounded-3xl p-6 md:p-8 shadow-[0_18px_60px_rgba(23,59,88,.07)]">
      <div className="flex items-start justify-between gap-4 mb-7"><div><p className="text-label font-bold text-primary mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" /> RINCI KEBUTUHAN</p><h2 className="text-2xl md:text-3xl font-semibold">Apa saja yang perlu dibeli?</h2><p className="text-sm text-muted-foreground mt-2 max-w-2xl text-pretty">Ceritakan situasimu: kegiatan, tempat tinggal, transportasi, atau barang yang kamu pikirkan. EstiMate mencocokkan kata kunci dan template yang kamu pilih dengan daftar rekomendasi, lalu memecahnya menjadi item dengan kuantitas, satuan, dan harga per satuan.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">{period === 'daily' ? 'Harian' : 'Bulanan'}</span></div>
      <p className="mb-3 rounded-2xl border border-border/70 bg-secondary px-4 py-3 text-sm text-primary" role="note">
        {isExampleBudget
          ? `Batas anggaran sementara: ${budget ? rupiah(budget) : 'belum ada'} (contoh dari template). Kembali ke form untuk memasukkan budget kamu sendiri.`
          : `Batas anggaran pilihanmu: ${budget ? rupiah(budget) : 'belum ada'}. Rekomendasi tidak wajib menghabiskan seluruh budget.`}
      </p>
      <textarea value={criteria} onChange={(event) => setCriteria(event.target.value)} aria-label="Deskripsi kebutuhan" placeholder="Contoh: aku mahasiswa desain, bulan ini banyak tugas maket dan harus print 3 laporan. Ke kampus naik ojek." className="min-h-28 w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed outline-none focus:border-primary" />
      <div className="mt-4 flex flex-wrap gap-3"><Button onClick={runGenerate} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"><RefreshCw className="mr-2 h-4 w-4" /> Generate item belanja</Button><Button variant="ghost" onClick={onBack} className="rounded-full">Kembali ubah rencana</Button></div>

      {contexts.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Konteks terdeteksi:</span>
          {contexts.map((context) => (
            <span key={context.id} className="rounded-full border border-border bg-secondary px-3 py-1 font-medium text-primary">
              {context.label}
              <span className="sr-only">{context.source === 'template' ? ' (dari template)' : ' (dari deskripsi)'}</span>
              {context.source === 'template' && <span className="text-muted-foreground"> · template</span>}
            </span>
          ))}
        </div>
      )}
      {usedFallback && <p className="mt-3 text-sm text-muted-foreground">Belum ada kata kunci yang cocok, jadi EstiMate menampilkan kebutuhan dasar. Tambahkan detail agar rekomendasinya lebih relevan.</p>}

      {items.length > 0 && <div className="mt-8 border-t border-border/70 pt-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-semibold">Review item belanja</h3><p className="text-sm text-muted-foreground">Harga adalah estimasi per satuan. Kamu masih bisa mengubah semuanya.</p></div><p className="font-mono text-sm text-primary">Total estimasi {rupiah(total)}</p></div>
        <p className="mb-4 flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span>Rekomendasi dibuat dengan aturan kata kunci, bukan AI. Nominal harga adalah estimasi umum, bukan harga pasar real-time atau harga baku. Sesuaikan dengan lokasi, satuan, dan waktu belanjamu.</span></p>
        <div className="space-y-3">{items.map((item, index) => {
          const isOptional = item.priority === 'optional'
          return (
            <div key={item.id ?? index} className="rounded-2xl border border-border/70 bg-background p-4">
              <div className="grid gap-3 md:grid-cols-[1.35fr_1fr_.7fr_1fr_.8fr_auto] md:items-center"><Input value={item.name} onChange={(event) => update(index, { name: event.target.value })} aria-label={`Nama item ${index + 1}`} placeholder="Nama barang" className="rounded-xl" /><Input value={item.category} onChange={(event) => update(index, { category: event.target.value })} aria-label={`Kategori dan satuan ${index + 1}`} placeholder="Kategori · satuan" className="rounded-xl" /><Input type="number" min="1" step="1" value={item.quantity} onChange={(event) => update(index, { quantity: Math.max(1, Math.round(Number(event.target.value)) || 1) })} aria-label={`Kuantitas ${index + 1}`} className="rounded-xl" /><Input type="number" min="0" value={item.unitPrice} onChange={(event) => update(index, { unitPrice: Math.max(0, Number(event.target.value) || 0) })} aria-label={`Estimasi harga per satuan ${index + 1}`} placeholder="Harga / unit" className="rounded-xl" /><p className="font-mono text-sm text-primary">{rupiah(itemTotal(item))}</p><Button variant="ghost" size="icon" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Hapus ${item.name}`}><Trash2 className="h-4 w-4" /></Button></div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <button type="button" onClick={() => update(index, { priority: isOptional ? 'essential' : 'optional' })} aria-label={`Prioritas ${item.name}: ${isOptional ? 'opsional' : 'penting'}. Klik untuk mengubah.`} className={`rounded-full border px-2.5 py-0.5 font-medium transition-colors ${isOptional ? 'border-border text-muted-foreground hover:bg-secondary' : 'border-primary/30 bg-secondary text-primary hover:bg-secondary/70'}`}>{isOptional ? 'Opsional' : 'Penting'}</button>
                <span className="font-mono">{item.quantity} × {rupiah(item.unitPrice || 0)}</span>
                {item.reason && <span>· {item.reason}</span>}
              </div>
            </div>
          )
        })}</div>
        <Button variant="outline" onClick={addItem} className="mt-4 rounded-full"><Plus className="mr-2 h-4 w-4" /> Tambah item sendiri</Button>

        {analysis.status === 'within' && <p className="mt-6 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm text-primary">Masih dalam budget {rupiah(analysis.budget)}. Sisa {rupiah(analysis.remaining)}.</p>}
        {analysis.status === 'over' && (
          <div className="mt-6 rounded-2xl border border-danger-border bg-danger-soft p-4 text-danger-text" role="status">
            <p className="font-semibold">Melebihi budget {rupiah(analysis.budget)} sebesar {rupiah(analysis.over)}</p>
            <p className="mt-1 text-sm opacity-90">Saran hemat disesuaikan dengan batas budgetmu dan tidak diterapkan otomatis. Cek kebutuhan penting sebelum menyetujui perubahan:</p>
            {analysis.suggestions.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {analysis.suggestions.map((suggestion) => (
                  <li key={`${suggestion.kind}-${suggestion.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger-border/60 px-3 py-2">
                    <span>
                      {suggestion.kind === 'remove' ? `Pertimbangkan menunda "${suggestion.name}" (opsional)` : `Pertimbangkan mengurangi "${suggestion.name}" menjadi ${suggestion.newQuantity}`}
                      <span className="font-mono"> · potensi hemat {rupiah(suggestion.saving)}</span>
                    </span>
                    <Button type="button" size="sm" variant="outline" className="rounded-full border-danger-border bg-card text-danger-text hover:bg-danger-soft" onClick={() => applySuggestion(suggestion.id, suggestion.kind, suggestion.newQuantity)}>
                      Terapkan saran
                    </Button>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm">Tandai item yang bisa ditunda sebagai Opsional untuk melihat saran pengurangan.</p>}
            {analysis.stillOverAfterSuggestions > 0 && <p className="mt-3 text-sm">Bahkan jika seluruh saran diterapkan, estimasi masih lebih tinggi {rupiah(analysis.stillOverAfterSuggestions)}. Periksa kebutuhan minimum, cari alternatif yang lebih hemat, atau sesuaikan batas budget. Jangan mengurangi kebutuhan pokok hanya agar angka terlihat pas.</p>}
          </div>
        )}

        <div><Button onClick={() => onConfirm(items)} disabled={!items.length} className="mt-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"><Check className="mr-2 h-4 w-4" /> Simpan kebutuhan & buka rencana <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
      </div>}
    </section>
  )
}
