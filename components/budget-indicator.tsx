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
        'p-6 border border-border/50 transition-colors',
        status === 'safe' && 'bg-success',
        status === 'warning' && 'bg-warning',
        status === 'danger' && 'bg-danger',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-mono-sm opacity-70">
            {status === 'safe' && 'STATUS_SAFE'}
            {status === 'warning' && 'STATUS_WARNING'}
            {status === 'danger' && 'STATUS_OVER'}
          </span>
          <h3 className="text-display text-3xl md:text-4xl mt-1 text-white">
            {status === 'safe' && 'Aman'}
            {status === 'warning' && 'Limit'}
            {status === 'danger' && 'Over'}
          </h3>
        </div>
        <span className="text-display text-4xl md:text-5xl opacity-30 text-white">
          {percentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white/20 overflow-hidden mb-4">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-white">
        <div>
          <span className="text-label opacity-70">Total</span>
          <div className="font-mono font-bold text-lg mt-1">
            {formatCurrency(currentTotal)}
          </div>
        </div>
        <div className="text-right">
          <span className="text-label opacity-70">Limit</span>
          <div className="font-mono font-bold text-lg mt-1">
            {formatCurrency(budgetLimit)}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between text-white">
          <span className="text-label opacity-70">
            {remaining >= 0 ? 'Sisa' : 'Kelebihan'}
          </span>
          <span className="font-mono font-bold text-xl">
            {remaining >= 0 ? formatCurrency(remaining) : formatCurrency(Math.abs(remaining))}
          </span>
        </div>
      </div>
    </div>
  )
}
