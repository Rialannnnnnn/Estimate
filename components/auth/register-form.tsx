'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MIN_PASSWORD_LENGTH = 6

function getSignUpErrorMessage(error: { message: string; status?: number; code?: string }) {
  if (error.code === 'weak_password' || /password/i.test(error.message)) {
    return `Password terlalu lemah. Gunakan minimal ${MIN_PASSWORD_LENGTH} karakter dengan kombinasi huruf dan angka.`
  }
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
    return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  }
  if (error.code === 'email_address_invalid') {
    return 'Alamat email tidak valid.'
  }
  return 'Pendaftaran gagal. Periksa data kamu dan coba lagi.'
}

export function RegisterForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) {
      setError('Nama lengkap wajib diisi.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`)
      return
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: {
          full_name: trimmedName,
        },
      },
    })

    if (signUpError) {
      setError(getSignUpErrorMessage(signUpError))
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    setConfirmationSentTo(trimmedEmail)
    setLoading(false)
  }

  if (confirmationSentTo) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground">Cek email kamu</h2>
        <p className="leading-relaxed text-muted-foreground">
          Kami sudah mengirim link konfirmasi ke <span className="font-semibold text-foreground">{confirmationSentTo}</span>.
          Klik link tersebut untuk mengaktifkan akun, lalu kamu akan langsung diarahkan ke dashboard.
        </p>
        <p className="text-sm text-muted-foreground">Tidak menemukan emailnya? Periksa folder spam atau promosi.</p>
        <Button
          asChild
          variant="outline"
          className="h-12 rounded-full border border-primary/20 bg-card font-semibold text-primary hover:bg-secondary"
        >
          <Link href="/auth/login">Ke halaman Masuk</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="full-name" className="text-label">
          Nama lengkap
        </label>
        <Input
          id="full-name"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nama kamu"
          className="h-12 rounded-xl border border-border bg-background text-foreground"
        />
      </div>

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
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl border border-border bg-background text-foreground"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-password" className="text-label">
          Konfirmasi password
        </label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        disabled={loading}
        className="h-12 rounded-full border border-primary bg-primary font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Membuat akun...' : 'Buat Akun'}
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  )
}
