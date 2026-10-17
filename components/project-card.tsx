'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { TemplateType } from '@/lib/templates'

interface ProjectCardProps {
  id: string
  name: string
  templateType: TemplateType
  budget: number
  spent: number
  onDelete: (id: string) => void
}

const templateNames: Record<TemplateType, string> = {
  'harian-dasar': 'Kebutuhan Harian Dasar',
  'anak-kos': 'Budget Anak Kos',
  'transportasi': 'Transportasi Bulanan',
  'makan-minum': 'Makan & Minum Bulanan',
  'tagihan-bulanan': 'Tagihan Bulanan',
  'belanja-kamar': 'Belanja Kamar & Rumah',
  'kesehatan': 'Kesehatan & Perawatan',
  'hiburan': 'Hiburan Terkontrol',
  'kuliah-kerja': 'Kuliah & Kerja',
  'target-menabung': 'Target Menabung',
}

export function ProjectCard({
  id,
  name,
  templateType,
  budget,
  spent,
  onDelete,
}: ProjectCardProps) {
  const percentage = Math.round((spent / budget) * 100)
  const remaining = budget - spent

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(`Hapus proyek "${name}"?`)) {
      onDelete(id)
    }
  }

  return (
    <Link
      href={`/dashboard/project/${id}`}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="surface-card h-full rounded-3xl bg-brand-blue border border-white/15 p-6 flex flex-col justify-between cursor-pointer hover:border-white/30 hover:brightness-110 hover:shadow-[0_16px_36px_rgba(15,46,71,.22)]">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-white font-bold text-lg line-clamp-2 flex-1">{name}</h3>
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-white/80 hover:bg-white/10 ml-2 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-label text-white/60">{templateNames[templateType]}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="bg-white/10 h-2 mb-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-mono-sm text-white/70">
              Rp {spent.toLocaleString('id-ID')}
            </span>
            <span className="text-mono-sm text-white/50">
              / Rp {budget.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-baseline justify-between">
          <span className="text-label text-white/60">Sisa</span>
          <span className="text-label font-bold text-white">
            Rp {remaining.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </Link>
  )
}
