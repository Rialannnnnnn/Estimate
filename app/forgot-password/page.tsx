import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Lupa Password | EstiMate',
  description: 'Pulihkan akses akun EstiMate melalui email.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow="Pemulihan akun" title="Lupa password?"
      description="Masukkan email akunmu. Kami akan mengirim tautan untuk membuat password baru."
      footer={<p>Sudah ingat password? <Link href="/auth/login" className="font-semibold text-primary hover:underline">Kembali ke login</Link></p>}>
      <ForgotPasswordForm />
    </AuthShell>
  )
}
