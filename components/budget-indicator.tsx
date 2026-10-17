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
  const isDanger = status === 'danger'

  const strongText = isDanger ? 'text-danger-text' : 'text-white'
  const labelText = isDanger ? 'text-danger-text/80' : 'text-white/90'
  const percentText = isDanger ? 'text-danger' : 'text-white/75'
  const trackBg = isDanger ? 'bg-danger-border/60' : 'bg-white/25'
  const fillBg = isDanger ? 'bg-danger' : 'bg-white'
  const dividerBorder = isDanger ? 'border-danger-border' : 'border-white/25'

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-[0_8px_24px_rgba(15,46,71,0.18)] transition-colors sm:p-6',
        status === 'safe' && 'bg-success border-white/15',
        status === 'warning' && 'bg-warning border-white/15',
        isDanger && 'bg-danger-soft border-danger-border',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <span className={cn('text-label', labelText)}>Status Anggaran</span>
          <h3 className={cn('text-display text-2xl sm:text-3xl md:text-4xl mt-2 text-balance', strongText)}>
            {STATUS_TITLES[status]}
          </h3>
        </div>
        <span className={cn('shrink-0 text-display text-3xl sm:text-4xl md:text-5xl', percentText)}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className={cn('h-2 overflow-hidden rounded-full mb-4', trackBg)}
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Penggunaan budget"
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300', fillBg)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className={cn('grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 min-[400px]:gap-4', strongText)}>
        <div className="flex items-baseline justify-between gap-2 min-[400px]:block">
          <span className={cn('text-label', labelText)}>Total</span>
          <div className="font-mono font-bold text-base sm:text-lg min-[400px]:mt-1 break-words">
            {formatCurrency(currentTotal)}
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2 min-[400px]:block min-[400px]:text-right">
          <span className={cn('text-label', labelText)}>Limit</span>
          <div className="font-mono font-bold text-base sm:text-lg min-[400px]:mt-1 break-words">
            {formatCurrency(budgetLimit)}
          </div>
        </div>
      </div>

      <div className={cn('mt-4 pt-4 border-t', dividerBorder)}>
        <div className={cn('flex flex-wrap items-center justify-between gap-2', strongText)}>
          <span className={cn('text-label', labelText)}>
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
