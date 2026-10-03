import type { Material, BudgetStatus } from './types'

export function calculateEstimatedTotal(materials: Material[]): number {
  return materials.reduce((sum, item) => {
    return sum + ((item.unitPrice ?? 0) * item.quantity)
  }, 0)
}

export function calculateActualTotal(materials: Material[]): number {
  return materials.reduce((sum, item) => {
    if (item.isPurchased && item.actualPrice != null) {
      return sum + (item.actualPrice * item.quantity)
    }
    return sum
  }, 0)
}

export function calculateRemainingBudget(budgetLimit: number, materials: Material[]): number {
  const spent = calculateActualTotal(materials)
  const estimatedRemaining = materials
    .filter(m => !m.isPurchased)
    .reduce((sum, item) => sum + ((item.unitPrice ?? 0) * item.quantity), 0)
  
  return budgetLimit - spent - estimatedRemaining
}

export function getBudgetStatus(currentTotal: number, budgetLimit: number): BudgetStatus {
  if (budgetLimit <= 0) return 'safe'
  
  const percentage = (currentTotal / budgetLimit) * 100
  
  if (percentage > 100) return 'danger'
  if (percentage >= 80) return 'warning'
  return 'safe'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function parseCurrencyInput(value: string): number {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '')
  return parseInt(cleaned, 10) || 0
}

export function getProgressPercentage(currentTotal: number, budgetLimit: number): number {
  if (budgetLimit <= 0) return 0
  return Math.min((currentTotal / budgetLimit) * 100, 100)
}
