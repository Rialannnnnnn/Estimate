import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Daftar | EstiMate',
  description: 'Buat akun EstiMate dan mulai susun budget dengan lebih tenang.',
}

export default function RegisterPage() {
  return (
    <AuthShell
        eyebrow="Daftar / Mulai lebih terarah"
        title="Mulai atur uangmu."
        description="Buat rencana budget, susun kebutuhan, dan kendalikan pengeluaran dari satu tempat."
      footer={
        <p>
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            Masuk
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
