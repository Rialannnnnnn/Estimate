'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSending(true)
    try {
      const supabase = createClient()
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })
      if (sendError) {
        setError(sendError.status === 429
          ? 'Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.'
          : 'Permintaan tidak dapat diproses. Coba lagi nanti.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Koneksi bermasalah. Coba lagi nanti.')
    } finally {
      setSending(false)
    }
  }

  if (sent) return (
    <div role="status" className="rounded-xl border border-border bg-secondary/40 p-5 text-sm leading-relaxed text-foreground">
      Jika alamat email terdaftar, tautan untuk membuat password baru akan dikirim. Periksa juga folder spam.
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="recovery-email" className="text-label">Email akun</label>
        <Input id="recovery-email" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com"
          className="h-12 rounded-xl border border-border bg-background text-foreground" />
      </div>
      {error && <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={sending || !email.trim()} className="h-12 rounded-full bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {sending ? 'Mengirim...' : 'Kirim link reset password'}
      </Button>
    </form>
  )
}
