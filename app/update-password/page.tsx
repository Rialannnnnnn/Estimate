import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { UpdatePasswordForm } from '@/components/auth/update-password-form'

export const metadata: Metadata = {
  title: 'Password Baru | EstiMate',
  description: 'Buat password baru untuk akun EstiMate.',
}

export default function UpdatePasswordPage() {
  return (
    <AuthShell eyebrow="Pemulihan akun" title="Password baru."
      description="Masukkan password baru untuk akunmu. Gunakan minimal 8 karakter."
      footer={<p>Link bermasalah? <Link href="/auth/forgot-password" className="font-semibold text-primary hover:underline">Minta link baru</Link></p>}>
      <UpdatePasswordForm />
    </AuthShell>
  )
}
