'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function getLoginErrorMessage(error: { message: string; status?: number; code?: string }) {
  if (error.code === 'email_not_confirmed' || /not confirmed/i.test(error.message)) {
    return 'Email kamu belum dikonfirmasi. Cek kotak masuk email untuk link konfirmasi.'
  }
  if (error.status === 429) {
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  }
  if (error.code === 'invalid_credentials' || error.status === 400) {
    return 'Email atau password salah.'
  }
  return 'Terjadi kesalahan yang tidak terduga. Coba lagi nanti.'
}

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(getLoginErrorMessage(signInError))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-label">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
          className="h-12 rounded-xl border border-border bg-background text-foreground"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-label">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl border border-border bg-background text-foreground"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !email || !password}
        className="h-12 rounded-full border border-primary bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Memproses...' : 'Masuk'}
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  )
}
