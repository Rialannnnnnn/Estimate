/** Pure calculations and starter recommendations for EstiMate Personal Finance.
 * This module has no database or UI dependencies and is safe to test independently.
 */

export type UserProfile = 'student' | 'worker'
export type MoneyMindset = 'security' | 'balance' | 'enjoyment' | 'growth'

export type Allocation = {
  key: 'needs' | 'wants' | 'savings' | 'buffer'
  label: string
  percentage: number
  amount: number
}

export type BurnRateSummary = {
  dailyBurnRate: number
  projectedSpending: number
  budgetUtilization: number
  remainingBudget: number
  daysRemaining: number
  status: 'safe' | 'warning' | 'danger'
}

const clampNonNegative = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0

/**
 * Recommend a starting allocation. Percentages always total 100.
 * This is a starting point, not financial advice; users can edit every value.
 */
export function recommendAllocations(
  monthlyIncome: number,
  profile: UserProfile,
  mindset: MoneyMindset,
): Allocation[] {
  const base: Record<UserProfile, Record<Allocation['key'], number>> = {
    student: { needs: 55, wants: 15, savings: 20, buffer: 10 },
    worker: { needs: 50, wants: 20, savings: 20, buffer: 10 },
  }
  const adjustments: Record<MoneyMindset, Partial<Record<Allocation['key'], number>>> = {
    security: { savings: 5, wants: -3, buffer: -2 },
    balance: {},
    enjoyment: { wants: 5, savings: -3, needs: -2 },
    growth: { savings: 5, wants: -3, buffer: -2 },
  }

  const percentages = { ...base[profile] }
  for (const [key, delta] of Object.entries(adjustments[mindset])) {
    percentages[key as Allocation['key']] += delta ?? 0
  }

  const labels: Record<Allocation['key'], string> = {
    needs: 'Kebutuhan', wants: 'Keinginan', savings: 'Tabungan', buffer: 'Dana cadangan',
  }
  return (Object.keys(percentages) as Allocation['key'][]).map((key) => ({
    key,
    label: labels[key],
    percentage: percentages[key],
    amount: Math.round((clampNonNegative(monthlyIncome) * percentages[key]) / 100),
  }))
}

/** Calculate a burn-rate forecast for a budget period. */
export function calculateBurnRate(input: {
  actualExpenses: number
  spendingBudget: number
  elapsedDays: number
  totalDays: number
}): BurnRateSummary {
  const actual = clampNonNegative(input.actualExpenses)
  const budget = clampNonNegative(input.spendingBudget)
  const totalDays = Math.max(1, Math.floor(clampNonNegative(input.totalDays)))
  const elapsedDays = Math.min(totalDays, Math.max(0, Math.floor(clampNonNegative(input.elapsedDays))))
  const daysRemaining = totalDays - elapsedDays
  const dailyBurnRate = elapsedDays > 0 ? actual / elapsedDays : 0
  const projectedSpending = actual + dailyBurnRate * daysRemaining
  const budgetUtilization = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0
  const remainingBudget = budget - actual

  let status: BurnRateSummary['status'] = 'safe'
  if (projectedSpending > budget && budget > 0) status = 'danger'
  else if (budget > 0 && (projectedSpending / budget) >= 0.8) status = 'warning'

  return {
    dailyBurnRate,
    projectedSpending,
    budgetUtilization,
    remainingBudget,
    daysRemaining,
    status,
  }
}

/** Sum expense transactions only. Savings contributions must not be passed here. */
export function sumExpenses(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + clampNonNegative(amount), 0)
}

/** Return saving progress as a percentage, capped at 100 for progress-bar display. */
export function calculateSavingProgress(contributed: number, target: number): number {
  const safeTarget = clampNonNegative(target)
  if (safeTarget === 0) return 0
  return Math.min((clampNonNegative(contributed) / safeTarget) * 100, 100)
}
