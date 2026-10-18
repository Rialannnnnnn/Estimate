'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password baru minimal 8 karakter.')
      return
    }
    if (password !== confirmation) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Link pemulihan sudah tidak valid atau kedaluwarsa. Minta link baru.')
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError('Tidak dapat memperbarui password. Coba gunakan password lain atau minta link baru.')
        return
      }
      await supabase.auth.signOut()
      setSuccess(true)
      router.refresh()
    } catch {
      setError('Koneksi bermasalah. Coba lagi nanti.')
    } finally {
      setSaving(false)
    }
  }

  if (success) return (
    <div role="status" className="flex flex-col gap-4 rounded-xl border border-border bg-secondary/40 p-5 text-sm">
      <p>Password berhasil diperbarui. Silakan masuk menggunakan password barumu.</p>
      <Link href="/auth/login" className="font-semibold text-primary hover:underline">Kembali ke login</Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="new-password" className="text-label">Password baru</label>
        <Input id="new-password" type="password" autoComplete="new-password" required minLength={8} value={password}
          onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl border border-border bg-background text-foreground" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-password" className="text-label">Ulangi password baru</label>
        <Input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)} className="h-12 rounded-xl border border-border bg-background text-foreground" />
      </div>
      {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving || !password || !confirmation} className="h-12 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {saving ? 'Menyimpan...' : 'Simpan password baru'}
      </Button>
    </form>
  )
}
