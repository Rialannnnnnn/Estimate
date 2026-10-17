'use client'

import { cn } from '@/lib/utils'
import type { BudgetStatus } from '@/lib/types'
import { formatCurrency, getProgressPercentage } from '@/lib/budget'

interface BudgetIndicatorProps {
  currentTotal: number
  budgetLimit: number
  status: BudgetStatus
  className?: string
}

const STATUS_TITLES: Record<BudgetStatus, string> = {
  safe: 'Aman',
  warning: 'Mendekati Batas',
  danger: 'Melebihi Budget',
}

export function BudgetIndicator({
  currentTotal,
  budgetLimit,
  status,
  className,
}: BudgetIndicatorProps) {
  const percentage = getProgressPercentage(currentTotal, budgetLimit)
  const remaining = budgetLimit - currentTotal

  return (
    <div
      className={cn(
        'p-4 sm:p-6 border border-border/50 transition-colors',
        status === 'safe' && 'bg-success',
        status === 'warning' && 'bg-warning',
        status === 'danger' && 'bg-danger',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <span className="text-label text-white/90">Status Anggaran</span>
          <h3 className="text-display text-2xl sm:text-3xl md:text-4xl mt-2 text-white text-balance">
            {STATUS_TITLES[status]}
          </h3>
        </div>
        <span className="shrink-0 text-display text-3xl sm:text-4xl md:text-5xl text-white/60">
          {percentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="h-2 bg-white/25 overflow-hidden mb-4"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Penggunaan budget"
      >
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 min-[400px]:gap-4 text-white">
        <div className="flex items-baseline justify-between gap-2 min-[400px]:block">
          <span className="text-label text-white/90">Total</span>
          <div className="font-mono font-bold text-base sm:text-lg min-[400px]:mt-1 break-words">
            {formatCurrency(currentTotal)}
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2 min-[400px]:block min-[400px]:text-right">
          <span className="text-label text-white/90">Limit</span>
          <div className="font-mono font-bold text-base sm:text-lg min-[400px]:mt-1 break-words">
            {formatCurrency(budgetLimit)}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/25">
        <div className="flex flex-wrap items-center justify-between gap-2 text-white">
          <span className="text-label text-white/90">
            {remaining >= 0 ? 'Sisa' : 'Kelebihan'}
          </span>
          <span className="font-mono font-bold text-lg sm:text-xl break-words">
            {remaining >= 0 ? formatCurrency(remaining) : formatCurrency(Math.abs(remaining))}
          </span>
        </div>
      </div>
    </div>
  )
}
