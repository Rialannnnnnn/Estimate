'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, Check, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Material } from '@/lib/types'

type Props = {
  period: 'daily' | 'monthly'
  initialCriteria: string
  initialItems: Material[]
  onConfirm: (items: Material[]) => void
  onBack: () => void
}

type CatalogItem = Omit<Material, 'id' | 'actualPrice' | 'isPurchased'> & { unit: string; keys: string[] }

const catalog: CatalogItem[] = [
  { keys: ['nasi', 'beras', 'masak'], name: 'Beras', category: 'Makanan', unit: 'kg', quantity: 5, unitPrice: 75000 },
  { keys: ['telur', 'protein'], name: 'Telur ayam', category: 'Makanan', unit: 'butir', quantity: 10, unitPrice: 28000 },
  { keys: ['tahu'], name: 'Tahu putih', category: 'Makanan', unit: 'pcs', quantity: 10, unitPrice: 15000 },
  { keys: ['tempe'], name: 'Tempe', category: 'Makanan', unit: 'papan', quantity: 2, unitPrice: 12000 },
  { keys: ['sayur', 'sayuran'], name: 'Sayuran campur', category: 'Makanan', unit: 'ikat', quantity: 8, unitPrice: 8000 },
  { keys: ['minyak', 'goreng'], name: 'Minyak goreng', category: 'Dapur', unit: 'liter', quantity: 2, unitPrice: 19000 },
  { keys: ['mie', 'mi instan'], name: 'Mi instan', category: 'Makanan', unit: 'pcs', quantity: 10, unitPrice: 3500 },
  { keys: ['galon', 'air minum'], name: 'Air minum galon', category: 'Makanan', unit: 'galon', quantity: 2, unitPrice: 22000 },
  { keys: ['sabun mandi', 'sabun'], name: 'Sabun mandi', category: 'Perawatan', unit: 'pcs', quantity: 2, unitPrice: 6000 },
  { keys: ['sampo', 'shampoo'], name: 'Sampo', category: 'Perawatan', unit: 'botol', quantity: 1, unitPrice: 28000 },
  { keys: ['pasta gigi', 'odol'], name: 'Pasta gigi', category: 'Perawatan', unit: 'tube', quantity: 1, unitPrice: 18000 },
  { keys: ['rinso', 'deterjen', 'laundry'], name: 'Deterjen Rinso', category: 'Rumah tangga', unit: 'pack', quantity: 1, unitPrice: 32000 },
  { keys: ['pewangi'], name: 'Pewangi pakaian', category: 'Rumah tangga', unit: 'botol', quantity: 1, unitPrice: 18000 },
  { keys: ['tisu'], name: 'Tisu', category: 'Rumah tangga', unit: 'pack', quantity: 2, unitPrice: 14000 },
  { keys: ['sabun cuci', 'cuci piring'], name: 'Sabun cuci piring', category: 'Rumah tangga', unit: 'botol', quantity: 1, unitPrice: 16000 },
  { keys: ['bensin', 'motor'], name: 'Bensin', category: 'Transportasi', unit: 'liter', quantity: 12, unitPrice: 13000 },
  { keys: ['ojek', 'gojek', 'grab'], name: 'Ojek online', category: 'Transportasi', unit: 'kali', quantity: 8, unitPrice: 15000 },
  { keys: ['pulsa', 'internet', 'wifi'], name: 'Pulsa / paket internet', category: 'Tagihan', unit: 'bulan', quantity: 1, unitPrice: 75000 },
  { keys: ['listrik'], name: 'Token listrik', category: 'Tagihan', unit: 'bulan', quantity: 1, unitPrice: 150000 },
  { keys: ['kos', 'sewa'], name: 'Uang kos', category: 'Tempat tinggal', unit: 'bulan', quantity: 1, unitPrice: 900000 },
  { keys: ['tabung', 'menabung'], name: 'Setoran tabungan', category: 'Masa depan', unit: 'target', quantity: 1, unitPrice: 250000 },
]

function makeItem(item: CatalogItem, period: Props['period'], index: number): Material {
  return { id: `generated-${Date.now()}-${index}`, name: item.name, category: `${item.category} · ${item.unit}`, quantity: period === 'daily' ? Math.max(1, Math.ceil(item.quantity / 30)) : item.quantity, unitPrice: item.unitPrice, actualPrice: null, isPurchased: false }
}

function generate(criteria: string, period: Props['period']): Material[] {
  const text = criteria.toLowerCase()
  const matches = catalog.filter((item) => item.keys.some((key) => text.includes(key)))
  const fallbackKeys = period === 'daily' ? ['nasi', 'telur', 'sayur', 'ojek'] : ['nasi', 'telur', 'rinso', 'sabun', 'pulsa', 'tabung']
  const selected = matches.length ? matches : catalog.filter((item) => fallbackKeys.some((key) => item.keys.includes(key)))
  return selected.map((item, index) => makeItem(item, period, index))
}

export function NeedsGenerator({ period, initialCriteria, initialItems, onConfirm, onBack }: Props) {
  const [criteria, setCriteria] = useState(initialCriteria)
  const [items, setItems] = useState(initialItems)
  const total = useMemo(() => items.reduce((sum, item) => sum + (item.unitPrice || 0) * Math.max(1, item.quantity || 1), 0), [items])
  const update = (index: number, patch: Partial<Material>) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  const addItem = () => setItems((current) => [...current, { id: `custom-${Date.now()}`, name: 'Kebutuhan baru', category: 'Lainnya · unit', quantity: 1, unitPrice: 0, actualPrice: null, isPurchased: false }])

  return (
    <section className="border border-border/70 bg-card/90 rounded-3xl p-6 md:p-8 shadow-[0_18px_60px_rgba(23,59,88,.07)]">
      <div className="flex items-start justify-between gap-4 mb-7"><div><p className="text-label font-bold text-primary mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" /> RINCI KEBUTUHAN</p><h2 className="text-2xl md:text-3xl font-semibold">Apa saja yang perlu dibeli?</h2><p className="text-sm text-muted-foreground mt-2 max-w-2xl">Tulis bahan, barang, atau tagihan yang kamu pikirkan. EstiMate akan memecahnya menjadi item belanja yang punya kuantitas, satuan, dan harga per item.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">{period === 'daily' ? 'Harian' : 'Bulanan'}</span></div>
      <textarea value={criteria} onChange={(event) => setCriteria(event.target.value)} placeholder="Contoh: anak kos, mau masak nasi dengan telur dan tahu, perlu rinso, sabun mandi, pulsa, bensin, dan tabungan" className="min-h-28 w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm outline-none focus:border-primary" />
      <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => setItems(generate(criteria, period))} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"><RefreshCw className="mr-2 h-4 w-4" /> Generate item belanja</Button><Button variant="ghost" onClick={onBack} className="rounded-full">Kembali ubah rencana</Button></div>
      {items.length > 0 && <div className="mt-8 border-t border-border/70 pt-7"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h3 className="font-semibold">Review item belanja</h3><p className="text-sm text-muted-foreground">Harga adalah estimasi per satuan. Kamu masih bisa mengubah semuanya.</p></div><p className="font-mono text-sm text-primary">Total Rp {total.toLocaleString('id-ID')}</p></div><div className="space-y-3">{items.map((item, index) => <div key={item.id ?? index} className="grid gap-3 rounded-2xl border border-border/70 bg-background p-4 md:grid-cols-[1.35fr_1fr_.7fr_1fr_.8fr_auto] md:items-center"><Input value={item.name} onChange={(event) => update(index, { name: event.target.value })} aria-label={`Nama item ${index + 1}`} placeholder="Nama barang" className="rounded-xl" /><Input value={item.category} onChange={(event) => update(index, { category: event.target.value })} aria-label={`Kategori dan satuan ${index + 1}`} placeholder="Kategori · satuan" className="rounded-xl" /><Input type="number" min="1" value={item.quantity} onChange={(event) => update(index, { quantity: Math.max(1, Number(event.target.value) || 1) })} aria-label={`Kuantitas ${index + 1}`} className="rounded-xl" /><Input type="number" min="0" value={item.unitPrice} onChange={(event) => update(index, { unitPrice: Math.max(0, Number(event.target.value) || 0) })} aria-label={`Harga per satuan ${index + 1}`} placeholder="Harga / unit" className="rounded-xl" /><p className="font-mono text-sm text-primary">Rp {((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString('id-ID')}</p><Button variant="ghost" size="icon" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Hapus ${item.name}`}><Trash2 className="h-4 w-4" /></Button></div>)}</div><Button variant="outline" onClick={addItem} className="mt-4 rounded-full"><Plus className="mr-2 h-4 w-4" /> Tambah item sendiri</Button><div><Button onClick={() => onConfirm(items)} disabled={!items.length} className="mt-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"><Check className="mr-2 h-4 w-4" /> Simpan kebutuhan & buka rencana <ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>}
    </section>
  )
}
