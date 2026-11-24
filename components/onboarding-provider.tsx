'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OnboardingTour } from '@/components/onboarding-tour'
import { BookOpen } from 'lucide-react'

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    let active = true
    const loadUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!active) return
      if (!error && user) {
        setUserId(user.id)
        setOpen(user.user_metadata?.onboarding_completed === false)
      }
      setReady(true)
    }
    void loadUser()
    return () => { active = false }
  }, [supabase])

  const complete = async () => {
    setOpen(false)
    if (!userId) return
    const { error } = await supabase.auth.updateUser({ data: { onboarding_completed: true } })
    if (error) console.error('Unable to save onboarding status:', error)
  }

  return (
    <>
      {children}
      {ready && <OnboardingTour key={pathname.startsWith('/dashboard/project/') ? 'project' : 'dashboard'} open={open} onClose={() => void complete()} />}
      {ready && userId && !open && (
        <button type="button" onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-3 text-sm font-semibold text-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-secondary"
          aria-label="Buka panduan EstiMate">
          <BookOpen className="h-4 w-4" /> Panduan
        </button>
      )}
    </>
  )
}
