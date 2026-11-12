'use client'

import { useState } from 'react'
import { CalendarDays, Plus, Target, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SavingGoal } from '@/lib/personal-finance'
import { rupiah } from '@/lib/personal-finance'

export function GoalsPanel({ goals, onAdd, onContribute, onDelete }: { goals: SavingGoal[]; onAdd: (goal: SavingGoal) => void; onContribute: (goal: SavingGoal, amount: number) => void; onDelete: (id: string) => void }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')
  const [contribution, setContribution] = useState<Record<string, string>>({})
  const addGoal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim() || Number(target) <= 0) return
    onAdd({ id: crypto.randomUUID(), name: name.trim(), target: Number(target), saved: 0, deadline, contributions: [] })
    setName(''); setTarget(''); setDeadline('')
  }
  return <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
    <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Target aria-hidden="true" /></span><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rencana masa depan</p><h2 className="text-xl font-semibold">Target tabungan</h2></div></div>
    <form onSubmit={addGoal} className="mt-5 grid gap-3 sm:grid-cols-[1fr_150px_160px_auto]"><Input aria-label="Nama tujuan" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama tujuan" /><Input aria-label="Target nominal" required type="number" min="1" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Target Rp" /><Input aria-label="Tenggat" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /><Button type="submit"><Plus data-icon="inline-start" />Tambah tujuan</Button></form>
    {goals.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Belum ada tujuan. Tambahkan target pertama untuk mulai melacak kemajuan.</p> : <div className="mt-5 grid gap-4 md:grid-cols-2">{goals.map((goal) => {
      const progress = Math.min(100, goal.saved / goal.target * 100)
      const monthsLeft = goal.deadline ? Math.max(1, Math.ceil((new Date(`${goal.deadline}T00:00:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))) : null
      const remaining = Math.max(0, goal.target - goal.saved)
      return <article key={goal.id} className="rounded-2xl border border-border p-4">
        <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{goal.name}</h3><p className="mt-1 text-xs text-muted-foreground">{goal.deadline && <><CalendarDays className="mr-1 inline size-3" />{new Date(`${goal.deadline}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</>}</p></div><Button variant="ghost" size="icon" aria-label={`Hapus tujuan ${goal.name}`} onClick={() => onDelete(goal.id)}><Trash2 /></Button></div>
        <div className="mt-4 flex justify-between text-sm"><span>{rupiah(goal.saved)} terkumpul</span><span className="text-muted-foreground">dari {rupiah(goal.target)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={`Progres ${goal.name}`} aria-valuemin={0} aria-valuemax={goal.target} aria-valuenow={goal.saved}><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{Math.round(progress)}% tercapai</span><span>{monthsLeft ? `Perlu ${rupiah(Math.ceil(remaining / monthsLeft))}/bulan` : `${rupiah(remaining)} tersisa`}</span></div>
        {remaining > 0 && <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); const amount = Math.min(remaining, Number(contribution[goal.id]) || 0); if (amount > 0) { onContribute(goal, amount); setContribution((current) => ({ ...current, [goal.id]: '' })) } }}><Input aria-label={`Nominal kontribusi untuk ${goal.name}`} type="number" min="1" max={remaining} value={contribution[goal.id] ?? ''} onChange={(event) => setContribution((current) => ({ ...current, [goal.id]: event.target.value }))} placeholder="Tambah kontribusi" /><Button type="submit" variant="outline" disabled={!contribution[goal.id]}>Simpan</Button></form>}
        {goal.contributions.length > 0 && <div className="mt-4 border-t border-border pt-3"><p className="text-xs font-semibold text-muted-foreground">Riwayat kontribusi</p><ul className="mt-2 flex flex-col gap-1">{goal.contributions.slice(-3).reverse().map((entry) => <li key={entry.id} className="flex justify-between text-xs text-muted-foreground"><span>{new Date(`${entry.date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span><span>+{rupiah(entry.amount)}</span></li>)}</ul></div>}
      </article>
    })}</div>}
  </section>
}
