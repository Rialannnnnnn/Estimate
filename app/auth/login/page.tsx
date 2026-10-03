import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Masuk | EstiMate',
  description: 'Masuk ke EstiMate untuk mengelola rencana budgetmu.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const initialError =
    error === 'callback' ? 'Link konfirmasi tidak valid atau sudah kedaluwarsa. Silakan masuk atau daftar ulang.' : undefined

  return (
    <AuthShell
      eyebrow="Masuk / Lanjutkan rencanamu"
      title="Selamat datang kembali."
      description="Masuk untuk melihat dan mengatur rencana budget harian maupun bulananmu."
      footer={
        <p>
          Belum punya akun?{' '}
          <Link href="/auth/register" className="font-semibold text-primary underline-offset-4 hover:underline">
            Daftar
          </Link>
        </p>
      }
    >
      <LoginForm initialError={initialError} />
    </AuthShell>
  )
}
