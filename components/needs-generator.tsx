'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Info, Plus, RefreshCw, Send, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Material } from '@/lib/types'
import type { TemplateType } from '@/lib/templates'
import { analyzeBudget, itemTotal, type Priority, type PriceObservation } from '@/lib/recommendations'
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/budget'
import { createClient } from '@/lib/supabase/client'
import { applyNeedsChanges, type NeedsGenerationChange } from '@/lib/needs-merge'

type Props = {
  period: 'daily' | 'monthly'
  templateType?: TemplateType | null
  budgetLimit?: number | null
  isExampleBudget?: boolean
  initialCriteria: string
  initialItems: Material[]
  onItemsChange: (items: Material[]) => void
  onConfirm: (items: Material[]) => void
  onBack: () => void
}

type ReviewItem = Material & {
  priority?: Priority
  reason?: string
  priceSource?: 'personal-history' | 'catalogue' | 'manual'
  priceSampleCount?: number
  priceRangeMinimum?: number
  priceRangeMaximum?: number
  itemKey?: string
  dailyFrequency?: number
  periodDays?: number
}

type ConversationTurn = { role: 'user' | 'assistant'; content: string }

const CATEGORY_OPTIONS = [
  'Makanan & Minuman',
  'Bahan Makanan',
  'Transportasi',
  'Tempat Tinggal',
  'Tagihan',
  'Kuliah & Tugas',
  'Perlengkapan Proyek',
  'Alat & Bahan',
  'Rumah Tangga',
  'Perawatan',
  'Kesehatan',
  'Hiburan',
  'Tabungan',
  'Lainnya',
  'Tugas kuliah',
  'Tugas & dokumen',
  'Makan',
  'Kebutuhan kerja',
  'Tempat tinggal',
  'Rumah tangga',
  'Dapur',
  'Bahan makanan',
  'Keinginan',
  'Liburan',
  'Cadangan',
]

const UNIT_OPTIONS = [
  'pcs', 'buah', 'unit', 'porsi', 'butir', 'kg', 'gram', 'liter', 'ml',
  'botol', 'lembar', 'batang', 'meter', 'tube', 'pack', 'paket', 'roll',
  'set', 'kali', 'hari', 'bulan', 'perjalanan', 'galon', 'tabung',
  'bungkus', 'pasang', 'box', 'rim', 'jam', 'gelas', 'token', 'pouch',
  'karung 5 kg', 'ikat', 'papan', 'strip', 'orang', 'malam', 'tiket',
  'cup', 'trip', 'l', 'kilo', 'bks', 'karung', 'btr', 'potong',
  'bungkus isi 10', 'eksemplar', 'rangkap', 'halaman', 'hal', 'lbr',
  'alokasi', 'setoran',
]

function splitCategoryAndUnit(value: string) {
  const separator = value.lastIndexOf(' · ')
  if (separator < 0) return { category: value || 'Lainnya', unit: 'pcs' }
  return {
    category: value.slice(0, separator) || 'Lainnya',
    unit: value.slice(separator + 3) || 'pcs',
  }
}

const rupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`

export function NeedsGenerator({ period, templateType, budgetLimit, isExampleBudget = false, initialCriteria, initialItems, onItemsChange, onConfirm, onBack }: Props) {
  const [criteria, setCriteria] = useState(initialCriteria)
  const [items, setItems] = useState<ReviewItem[]>(() => initialItems.map((item, index) => ({
    ...item,
    id: item.id ?? `initial-${Date.now()}-${index}`,
  })))
  const [isGenerating, setIsGenerating] = useState(false)
  const [priceHistoryNotice, setPriceHistoryNotice] = useState('')
  const [assistantMessage, setAssistantMessage] = useState('')
  const [conversation, setConversation] = useState<ConversationTurn[]>([])
  const supabase = createClient()

  // Keep the dashboard's source-of-truth list synchronized even when the generator is hidden.
  useEffect(() => {
    onItemsChange(items)
  }, [items, onItemsChange])

  const budget = budgetLimit && budgetLimit > 0 ? budgetLimit : null
  const analysis = useMemo(() => analyzeBudget(items, budget), [items, budget])
  const total = analysis.total

  const update = (index: number, patch: Partial<ReviewItem>) => setItems((current) => current.map((item, itemIndex) => {
    if (itemIndex !== index) return item
    const overridesPriceBasis = patch.name !== undefined || patch.category !== undefined || patch.unitPrice !== undefined
    return {
      ...item,
      ...patch,
      ...(patch.quantity !== undefined ? {
        dailyFrequency: undefined,
        periodDays: undefined,
      } : {}),
      ...(overridesPriceBasis ? {
        itemKey: undefined,
        priceSource: 'manual' as const,
        priceSampleCount: 0,
        priceRangeMinimum: undefined,
        priceRangeMaximum: undefined,
      } : {}),
    }
  }))
  const addItem = () => setItems((current) => [...current, { id: `custom-${Date.now()}`, name: 'Kebutuhan baru', category: 'Lainnya · pcs', quantity: 1, unitPrice: 0, actualPrice: null, isPurchased: false, priority: 'essential', reason: 'ditambahkan manual', priceSource: 'manual', priceSampleCount: 0, itemKey: undefined }])
  const applySuggestion = (id: string, kind: 'remove' | 'reduce', newQuantity?: number) => {
    setItems((current) => kind === 'remove'
      ? current.filter((item) => (item.id ?? item.name) !== id)
      : current.map((item) => (item.id ?? item.name) === id && newQuantity && newQuantity >= 1
        ? { ...item, quantity: newQuantity, dailyFrequency: undefined, periodDays: undefined }
        : item))
  }
  const runGenerate = async () => {
    const prompt = criteria.trim()
    if (!prompt || isGenerating) return

    setIsGenerating(true)
    setPriceHistoryNotice('Memeriksa riwayat pembelian pribadi...')
    setAssistantMessage('')

    try {
      const now = new Date()
      const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      let priceHistory: PriceObservation[] = []
      let historyWarning = ''

      try {
        // RLS on project_materials limits this query to projects owned by the signed-in user.
        const { data, error } = await supabase
          .from('project_materials')
          .select('name, category, actual_price, actual_price_recorded_at')
          .eq('is_purchased', true)
          .not('actual_price', 'is', null)
          .not('actual_price_recorded_at', 'is', null)
          .gte('actual_price_recorded_at', cutoff.toISOString())
          .lte('actual_price_recorded_at', now.toISOString())

        if (error) throw error
        priceHistory = (data ?? [])
          .filter((row) => row.actual_price != null && row.actual_price_recorded_at)
          .map((row) => ({
            name: row.name,
            category: row.category,
            actualPrice: Number(row.actual_price),
            recordedAt: row.actual_price_recorded_at as string,
          }))
      } catch (historyError) {
        console.error('Failed to load personal price history:', historyError)
        historyWarning = 'Riwayat harga pribadi belum dapat dimuat; item baru memakai katalog estimasi.'
      }

      const response = await fetch('/api/needs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: prompt,
          period,
          templateType,
          budgetLimit: budget,
          currentItems: items.map((item) => ({
            id: item.id,
            itemKey: item.itemKey,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            isPurchased: item.isPurchased === true,
            dailyFrequency: item.dailyFrequency ?? null,
            periodDays: item.periodDays ?? null,
          })),
          conversation: conversation.slice(-6),
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'AI EstiMate tidak dapat memproses instruksi.')
      }

      const changes = Array.isArray(payload.changes) ? payload.changes as NeedsGenerationChange[] : []
      const nextItems = applyNeedsChanges(items, changes, {
        period,
        priceHistory,
        now: now.getTime(),
      })

      setItems(nextItems)
      const reply = [
        typeof payload.assistantMessage === 'string' ? payload.assistantMessage : 'Instruksi sudah diproses.',
        typeof payload.clarifyingQuestion === 'string' ? payload.clarifyingQuestion : '',
      ].filter(Boolean).join(' ')
      setAssistantMessage(reply)
      const userTurn: ConversationTurn = { role: 'user', content: prompt }
      const assistantTurn: ConversationTurn = { role: 'assistant', content: reply }
      setConversation((current) => [...current, userTurn, assistantTurn].slice(-16))
      setCriteria('')

      const personalCount = nextItems.filter((item) => item.priceSource === 'personal-history').length
      setPriceHistoryNotice(
        historyWarning || (personalCount > 0
          ? `${personalCount} item memakai median dari riwayat pembelian pribadimu. Harga lainnya berasal dari katalog atau input manual.`
          : 'Harga item baru berasal dari katalog estimasi atau perlu kamu isi manual. AI tidak mengarang harga.')
      )
    } catch (error) {
      console.error('AI needs generation failed:', error)
      setAssistantMessage(error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses instruksi. Daftar tetap aman.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="border border-border/70 bg-card/90 rounded-3xl p-6 md:p-8 shadow-[0_18px_60px_rgba(23,59,88,.07)]">
      <div className="flex items-start justify-between gap-4 mb-7"><div><p className="text-label font-bold text-primary mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" /> RINCI KEBUTUHAN</p><h2 className="text-2xl md:text-3xl font-semibold">Apa saja yang perlu dibeli?</h2><p className="text-sm text-muted-foreground mt-2 max-w-2xl text-pretty">Ceritakan kebutuhanmu seperti sedang berbicara dengan asisten. AI memahami kebutuhan rutin, frekuensi, anggaran, dan material proyek. Kategori serta satuan sudah tersedia sebagai pilihan. Item lama tetap dipertahankan saat kamu menambahkan kebutuhan baru.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">{period === 'daily' ? 'Harian' : 'Bulanan'}</span></div>
      <p className="mb-3 rounded-2xl border border-border/70 bg-secondary px-4 py-3 text-sm text-primary" role="note">
        {isExampleBudget
          ? `Batas anggaran sementara: ${budget ? rupiah(budget) : 'belum ada'} (contoh dari template). Kembali ke form untuk memasukkan budget kamu sendiri.`
          : `Batas anggaran pilihanmu: ${budget ? rupiah(budget) : 'belum ada'}. Rekomendasi tidak wajib menghabiskan seluruh budget.`}
      </p>
      {conversation.length > 0 && (
        <div className="mb-4 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-border/70 bg-background p-4" aria-label="Riwayat percakapan EstiMate">
          {conversation.map((turn, index) => (
            <div key={`${turn.role}-${index}`} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${turn.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide opacity-70">{turn.role === 'user' ? 'Kamu' : 'EstiMate AI'}</span>
                <p className="whitespace-pre-wrap">{turn.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Textarea value={criteria} onChange={(event) => setCriteria(event.target.value)} aria-label="Instruksi untuk AI EstiMate" placeholder="Ceritakan semua rencanamu di sini. Contoh: aku makan 3 kali sehari, sekali makan Rp25 ribu. Aku juga mau bikin kursi, apa saja bahannya? Lalu tambahkan telur 2 kg." className="min-h-28 rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed" />
      <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => void runGenerate()} disabled={isGenerating || !criteria.trim()} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"><Send className="mr-2 h-4 w-4" /> {isGenerating ? 'AI sedang memahami...' : 'Kirim ke AI EstiMate'}</Button><Button variant="ghost" onClick={onBack} className="rounded-full">Kembali ubah rencana</Button></div>
      {assistantMessage && <div className="mt-4 rounded-2xl border border-border bg-secondary px-4 py-3 text-sm leading-relaxed" role="status"><span className="mb-1 block text-xs font-semibold text-primary">AI ESTIMATE</span>{assistantMessage}</div>}

      {priceHistoryNotice && <p className="mt-3 rounded-xl border border-border bg-secondary px-3 py-2 text-xs leading-relaxed text-muted-foreground" role="status">{priceHistoryNotice}</p>}

      {items.length > 0 && <div className="mt-8 border-t border-border/70 pt-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-semibold">Review item belanja</h3><p className="text-sm text-muted-foreground">Harga adalah estimasi per satuan. Kamu masih bisa mengubah semuanya.</p></div><p className="font-mono text-sm text-primary">Total estimasi {rupiah(total)}</p></div>
        <p className="mb-4 flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span>AI membaca instruksi serta nama, kategori, jumlah, dan status item untuk memahami rencana. Harga pribadi dan Harga Asli tidak dikirim ke model. Item yang tidak disebut tetap dipertahankan. Harga hanya ditentukan aplikasi dari katalog atau riwayat pribadimu yang cocok; AI tidak mengarang harga.</span></p>
        <div className="space-y-3">{items.map((item, index) => {
          const isOptional = item.priority === 'optional'
          return (
            <div key={item.id ?? index} className="rounded-2xl border border-border/70 bg-background p-4">
              {(() => {
                const current = splitCategoryAndUnit(item.category)
                return (
                  <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_.8fr_.6fr_1fr_.8fr_auto] md:items-center">
                    <Input value={item.name} onChange={(event) => update(index, { name: event.target.value })} aria-label={`Nama item ${index + 1}`} placeholder="Nama barang" className="rounded-xl" />
                    <select value={current.category} onChange={(event) => update(index, { category: `${event.target.value} · ${current.unit}` })} aria-label={`Kategori ${index + 1}`} className="h-10 min-w-0 rounded-xl border border-input bg-background px-3 text-sm">
                      {!CATEGORY_OPTIONS.includes(current.category) && <option value={current.category}>{current.category}</option>}
                      {CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <select value={current.unit} onChange={(event) => update(index, { category: `${current.category} · ${event.target.value}` })} aria-label={`Satuan ${index + 1}`} className="h-10 min-w-0 rounded-xl border border-input bg-background px-3 text-sm">
                      {!UNIT_OPTIONS.includes(current.unit) && <option value={current.unit}>{current.unit}</option>}
                      {UNIT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <Input type="number" min="1" step="1" value={item.quantity} onChange={(event) => update(index, { quantity: Math.max(1, Math.round(Number(event.target.value)) || 1) })} aria-label={`Kuantitas ${index + 1}`} className="rounded-xl" />
                    <Input type="text" inputMode="numeric" value={formatCurrencyInput(item.unitPrice)} onChange={(event) => update(index, { unitPrice: Math.max(0, parseCurrencyInput(event.target.value)) })} aria-label={`Estimasi harga per satuan ${index + 1}`} placeholder="Harga / unit" className="rounded-xl" />
                    <p className="font-mono text-sm text-primary">{rupiah(itemTotal(item))}</p>
                    <Button variant="ghost" size="icon" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Hapus ${item.name}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )
              })()}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <button type="button" onClick={() => update(index, { priority: isOptional ? 'essential' : 'optional' })} aria-label={`Prioritas ${item.name}: ${isOptional ? 'opsional' : 'penting'}. Klik untuk mengubah.`} className={`rounded-full border px-2.5 py-0.5 font-medium transition-colors ${isOptional ? 'border-border text-muted-foreground hover:bg-secondary' : 'border-primary/30 bg-secondary text-primary hover:bg-secondary/70'}`}>{isOptional ? 'Opsional' : 'Penting'}</button>
                <span className="font-mono">{item.quantity} × {rupiah(item.unitPrice || 0)}</span>
                {item.dailyFrequency && item.periodDays && <span className="rounded-full border border-primary/20 bg-secondary px-2 py-0.5 text-primary">{item.dailyFrequency} kali/hari × {item.periodDays} hari = {item.quantity} {splitCategoryAndUnit(item.category).unit}</span>}
                {item.priceSource === 'personal-history' && item.priceRangeMinimum != null && item.priceRangeMaximum != null
                  ? <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-primary">Riwayat pribadi · {item.priceSampleCount} catatan · rentang {rupiah(item.priceRangeMinimum)}–{rupiah(item.priceRangeMaximum)}</span>
                  : item.priceSource === 'manual'
                    ? <span className="rounded-full border border-border px-2 py-0.5">Diubah manual</span>
                    : <span className="rounded-full border border-border px-2 py-0.5">Katalog estimasi</span>}
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
