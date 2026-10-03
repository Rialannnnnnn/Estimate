'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/budget'
import type { Template } from '@/lib/templates'
import { X } from 'lucide-react'

interface TemplatePreviewProps {
  template: Template | null
  isOpen: boolean
  onClose: () => void
}

export function TemplatePreview({ template, isOpen, onClose }: TemplatePreviewProps) {
  if (!template) return null

  const totalEstimatedPrice = template.defaultItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card border-2 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-display text-2xl text-foreground">
            {template.name}
          </DialogTitle>
          <DialogDescription className="text-foreground/70 mt-2">
            {template.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-6">
          {/* Budget Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-white/20 p-4">
              <p className="text-label text-foreground/60 mb-2">DANA TEMPLATE</p>
              <p className="text-display text-xl text-foreground">{formatCurrency(template.budget)}</p>
            </div>
            <div className="border-2 border-white/20 p-4">
              <p className="text-label text-foreground/60 mb-2">ESTIMASI TOTAL</p>
              <p className="text-display text-xl text-foreground">{formatCurrency(totalEstimatedPrice)}</p>
            </div>
          </div>

          {/* Default Items */}
          <div>
            <h3 className="text-label text-foreground/60 mb-4">ITEM YANG OTOMATIS DITAMBAHKAN</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {template.defaultItems.map((item, idx) => {
                const itemTotal = item.quantity * item.unitPrice
                return (
                  <div key={idx} className="border-2 border-white/10 p-3 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{item.name}</span>
                        <span className="text-xs text-foreground/50 px-2 py-1 bg-white/10 rounded">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-foreground/60">
                        <span>Qty: <strong className="text-foreground">{item.quantity}</strong></span>
                        <span>Harga Unit: <strong className="text-foreground">{formatCurrency(item.unitPrice)}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(itemTotal)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Info */}
          <div className="bg-white/5 border-2 border-white/10 p-4 text-sm text-foreground/70">
            <p>
              <strong>Catatan:</strong> Ketika Anda membuat proyek dengan template ini, semua item di atas akan otomatis ditambahkan. Anda dapat menambah, menghapus, atau memodifikasi item sesuai kebutuhan setelah proyek dibuat.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
