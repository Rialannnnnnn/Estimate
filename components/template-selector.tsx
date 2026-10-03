'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { templateList, templates } from '@/lib/templates'
import type { TemplateType } from '@/lib/templates'
import { TemplatePreview } from './template-preview'
import { Eye } from 'lucide-react'

interface TemplateSelectorProps {
  selected: TemplateType | null
  onSelect: (type: TemplateType) => void
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<TemplateType | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-px bg-border/50">
        {templateList.map((template, index) => (
          <div
            key={template.type}
            className={cn(
              'cursor-pointer transition-all p-6 bg-card border-2 hover:border-primary group',
              selected === template.type
                ? 'border-primary bg-primary/10'
                : 'border-border/50'
            )}
            onClick={() => onSelect(template.type)}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-label font-bold opacity-60">
                {String(index + 1).padStart(2, '0')}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewTemplate(template.type)
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
              >
                <Eye className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <h3 className="font-bold text-foreground mb-1 text-sm">
              {template.name}
            </h3>
            <p className="text-mono-sm text-muted-foreground mb-3 line-clamp-2">
              {template.description}
            </p>
            <div className="text-label font-mono text-primary">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0,
              }).format(template.budget)}
            </div>
          </div>
        ))}
      </div>

      <TemplatePreview
        template={previewTemplate ? templates[previewTemplate] : null}
        isOpen={previewTemplate !== null}
        onClose={() => setPreviewTemplate(null)}
      />
    </>
  )
}

