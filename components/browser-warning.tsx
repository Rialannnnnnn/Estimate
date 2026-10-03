'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BrowserWarning() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Detect in-app browsers (Instagram, Facebook, Line, etc.)
    const ua = navigator.userAgent || navigator.vendor
    const isInApp = /FBAN|FBAV|Instagram|Line|KAKAOTALK|Twitter/i.test(ua)
    setIsInAppBrowser(isInApp)
  }, [])

  if (!isInAppBrowser || isDismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning text-warning-foreground border-b border-white/20">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-mono-sm opacity-70">WARNING</span>
          <p className="text-sm font-medium">
            <strong>Buka di Safari/Chrome!</strong>
            <span className="hidden sm:inline"> Data tidak tersimpan via Instagram/Line.</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="text-warning-foreground hover:bg-white/10 p-1 h-auto"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
