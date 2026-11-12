'use client'

import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ExpenseCategory, PersonalTransaction, TransactionType } from '@/lib/personal-finance'
import { rupiah } from '@/lib/personal-finance'

export function TransactionsPanel({ transactions, categories, onAdd, onUpdate, onDelete }: { transactions: PersonalTransaction[]; categories: ExpenseCategory[]; onAdd: (transaction: PersonalTransaction) => void; onUpdate: (transaction: PersonalTransaction) => void; onDelete: (id: string) => void }) {
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0]?.name ?? 'Lainnya')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [editingId, setEditingId] = useState<string | null>(null)
  const resetForm = () => { setEditingId(null); setAmount(''); setDescription(''); setType('expense'); setCategory(categories[0]?.name ?? 'Lainnya'); setDate(new Date().toISOString().slice(0, 10)) }
  const edit = (item: PersonalTransaction) => { setEditingId(item.id); setType(item.type); setAmount(String(item.amount)); setCategory(item.type === 'expense' ? item.category : categories[0]?.name ?? 'Lainnya'); setDescription(item.description); setDate(item.date); document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0 || !description.trim()) return
    const existing = editingId ? transactions.find((item) => item.id === editingId) : undefined
    const transaction: PersonalTransaction = { id: editingId ?? crypto.randomUUID(), type, amount: numericAmount, category: type === 'income' ? 'Pemasukan' : type === 'saving' ? 'Tabungan' : category, description: description.trim(), date, ...(type === 'saving' && existing?.goalId ? { goalId: existing.goalId, contributionId: existing.contributionId } : {}) }
    if (editingId) onUpdate(transaction); else onAdd(transaction)
    resetForm()
  }
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
  const iconFor = (item: PersonalTransaction) => item.type === 'income' ? <ArrowDownLeft className="size-4" /> : item.type === 'saving' ? <span className="font-semibold">S</span> : <ArrowUpRight className="size-4" />
  return <section className="rounded-3xl border border-border bg-card p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catatan personal</p><h2 className="mt-1 text-xl font-semibold">Transaksi</h2></div>
    <form id="transaction-form" onSubmit={save} className="mt-5 grid gap-3 rounded-2xl bg-muted/60 p-4 sm:grid-cols-2"><div className="flex gap-1 rounded-xl bg-background p-1 sm:col-span-2" role="group" aria-label="Jenis transaksi">{([['expense', 'Pengeluaran'], ['income', 'Pemasukan'], ['saving', 'Tabungan']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${type === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{label}</button>)}</div>
      <label className="text-xs font-medium text-muted-foreground">Nominal<Input className="mt-1 h-10" inputMode="numeric" required min="1" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" /></label>
      {type === 'expense' && <label className="text-xs font-medium text-muted-foreground">Kategori<select className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>}
      <label className="text-xs font-medium text-muted-foreground">Keterangan<Input className="mt-1 h-10" required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Contoh: makan siang" /></label><label className="text-xs font-medium text-muted-foreground">Tanggal<Input className="mt-1 h-10" type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <div className="flex gap-2 sm:col-span-2"><Button type="submit" className="flex-1">{editingId ? 'Simpan perubahan' : <><Plus data-icon="inline-start" />Catat transaksi</>}</Button>{editingId && <Button type="button" variant="outline" onClick={resetForm}>Batal</Button>}</div>
    </form>
    <div className="mt-5 flex flex-col divide-y divide-border">{sorted.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Belum ada transaksi. Catat transaksi pertamamu di atas.</p> : sorted.map((item) => <div key={item.id} className="flex items-center gap-2 py-3 sm:gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${item.type === 'income' ? 'bg-success/10 text-success' : item.type === 'saving' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{iconFor(item)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.description}</p><p className="text-xs text-muted-foreground">{item.category} · {new Date(`${item.date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p></div><p className={`whitespace-nowrap text-xs font-semibold sm:text-sm ${item.type === 'income' ? 'text-success' : ''}`}>{item.type === 'expense' ? '−' : '+'}{rupiah(item.amount)}</p><Button variant="ghost" size="icon" aria-label={`Edit transaksi ${item.description}`} onClick={() => edit(item)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Hapus transaksi ${item.description}`} onClick={() => onDelete(item.id)}><Trash2 /></Button></div>)}</div>
  </section>
}
