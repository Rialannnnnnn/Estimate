'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ExpenseCategory } from '@/lib/personal-finance'
import { rupiah } from '@/lib/personal-finance'

export function AllocationPanel({ categories, budget, onChange }: { categories: ExpenseCategory[]; budget: number; onChange: (categories: ExpenseCategory[]) => void }) {
  const [newName, setNewName] = useState('')
  const allocated = categories.reduce((sum, item) => sum + item.amount, 0)
  const remaining = budget - allocated
  const update = (id: string, key: 'name' | 'amount' | 'isNeed' | 'isFixed' | 'sharePercent', value: string | number | boolean) => onChange(categories.map((item) => {
    if (item.id !== id) return item
    const others = categories.filter((category) => category.id !== id)
    if (key === 'amount') {
      const maxAmount = Math.max(0, budget - others.reduce((sum, category) => sum + category.amount, 0))
      const amount = Math.min(maxAmount, Math.max(0, Number(value) || 0))
      return { ...item, amount, sharePercent: budget > 0 ? Math.round(amount / budget * 1000) / 10 : 0 }
    }
    if (key === 'sharePercent') {
      const maxPercent = Math.max(0, 100 - others.reduce((sum, category) => sum + category.sharePercent, 0))
      const sharePercent = Math.min(maxPercent, Math.max(0, Number(value) || 0))
      return { ...item, sharePercent, amount: Math.floor(budget * sharePercent / 100) }
    }
    return { ...item, [key]: value }
  }))
  const addCategory = () => { const name = newName.trim(); if (!name) return; onChange([...categories, { id: crypto.randomUUID(), name, amount: 0, isNeed: false, isFixed: false, sharePercent: 0 }]); setNewName('') }
  return <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rencana bulan ini</p><h2 className="mt-1 text-xl font-semibold">Alokasi pengeluaran</h2></div><div className="text-right"><p className="text-xs text-muted-foreground">{remaining < 0 ? 'Melebihi budget' : 'Belum dialokasikan'}</p><p className={`font-semibold ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>{rupiah(Math.abs(remaining))}</p></div></div>
    <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Total alokasi budget" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={Math.min(allocated, budget)}><div className={`h-full rounded-full transition-all ${remaining < 0 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${budget > 0 ? Math.min(100, allocated / budget * 100) : allocated > 0 ? 100 : 0}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">Terpakai {rupiah(allocated)} dari {rupiah(budget)} budget tersedia</p>
    <div className="mt-4 flex flex-col divide-y divide-border">{categories.map((category) => <div key={category.id} className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_130px_75px_100px_auto] sm:items-center"><Input aria-label={`Nama kategori ${category.name}`} className="col-span-2 h-9 border-transparent bg-transparent px-1 font-medium shadow-none focus-visible:border-border focus-visible:bg-background sm:col-span-1" value={category.name} onChange={(event) => update(category.id, 'name', event.target.value)} /><label className="text-[10px] font-medium text-muted-foreground">Budget (Rp)<Input aria-label={`Budget kategori ${category.name}`} inputMode="numeric" className="mt-1 h-9 text-right" value={category.amount || ''} onChange={(event) => update(category.id, 'amount', event.target.value)} placeholder="0" /></label><label className="text-[10px] font-medium text-muted-foreground">Alokasi %<Input aria-label={`Persentase kategori ${category.name}`} type="number" min="0" max="100" className="mt-1 h-9 text-right" value={category.sharePercent || ''} onChange={(event) => update(category.id, 'sharePercent', Number(event.target.value) || 0)} placeholder="0" /></label><label className="flex items-center gap-1.5 text-xs text-muted-foreground"><input type="checkbox" checked={category.isNeed} onChange={(event) => update(category.id, 'isNeed', event.target.checked)} className="size-3.5 accent-primary" />Kebutuhan</label><Button variant="ghost" size="icon" aria-label={`Hapus kategori ${category.name}`} onClick={() => onChange(categories.filter((item) => item.id !== category.id))}><Trash2 /></Button><label className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground sm:col-span-5"><input type="checkbox" checked={category.isFixed} onChange={(event) => update(category.id, 'isFixed', event.target.checked)} className="size-3.5 accent-primary" />Pengeluaran tetap</label></div>)}</div>
    <div className="mt-3 flex gap-2"><Input aria-label="Nama kategori baru" className="h-10" value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); addCategory() } }} placeholder="Tambah kategori khusus" /><Button variant="outline" onClick={addCategory} disabled={!newName.trim()}><Plus data-icon="inline-start" />Tambah</Button></div>
  </section>
}
