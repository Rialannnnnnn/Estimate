export type FinancialStatus = 'Mahasiswa' | 'Pekerja' | 'Mahasiswa dan pekerja'
export type IncomeFrequency = 'Harian' | 'Mingguan' | 'Bulanan' | 'Tidak tetap'
export type TransactionType = 'expense' | 'income' | 'saving'
export type BurnStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL'

export interface FinanceProfile {
  status: FinancialStatus
  incomeSource: string
  monthlyIncome: number
  frequency: IncomeFrequency
  hasAdditionalIncome: boolean
  openingBalance: number
  firstAction: string
  priority: string
  priorityPercent: number
  savesBeforeSpending: string
  biggestChallenge: string
  monthlySavingTarget: number
  savingPurpose: string
  savingGoalAmount: number
  savingDeadline: string
  fixedExpenses: number
}

export interface ExpenseCategory {
  id: string
  name: string
  amount: number
  isNeed: boolean
  isFixed: boolean
  sharePercent: number
}

export interface PersonalTransaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  description: string
  date: string
  goalId?: string
  contributionId?: string
}

export interface SavingGoal {
  id: string
  name: string
  target: number
  saved: number
  deadline: string
  contributions: { id: string; amount: number; date: string }[]
}

export interface FinanceMetrics {
  totalExpenses: number
  effectiveIncome: number
  actualSavings: number
  availableSpendingBudget: number
  remainingBalance: number
  dailyBurnRate: number
  projectedMonthlyExpenses: number
  savingPerformance: number
  budgetUtilization: number
  runwayDays: number | null
  elapsedDays: number
  monthDays: number
  burnStatus: BurnStatus
  aheadPercent: number
  categoryTotals: { name: string; value: number }[]
  dailyTotals: { label: string; expenses: number; income: number }[]
}

export const defaultCategories: ExpenseCategory[] = [
  { id: 'food', name: 'Makan & minum', amount: 0, isNeed: true, isFixed: false, sharePercent: 36 },
  { id: 'transport', name: 'Transportasi', amount: 0, isNeed: true, isFixed: false, sharePercent: 10 },
  { id: 'education', name: 'Pendidikan', amount: 0, isNeed: true, isFixed: true, sharePercent: 8 },
  { id: 'housing', name: 'Tempat tinggal', amount: 0, isNeed: true, isFixed: true, sharePercent: 15 },
  { id: 'bills', name: 'Tagihan', amount: 0, isNeed: true, isFixed: true, sharePercent: 7 },
  { id: 'shopping', name: 'Belanja', amount: 0, isNeed: false, isFixed: false, sharePercent: 5 },
  { id: 'entertainment', name: 'Hiburan', amount: 0, isNeed: false, isFixed: false, sharePercent: 5 },
  { id: 'health', name: 'Kesehatan', amount: 0, isNeed: true, isFixed: false, sharePercent: 7 },
  { id: 'social', name: 'Sosial', amount: 0, isNeed: false, isFixed: false, sharePercent: 2 },
  { id: 'savings', name: 'Tabungan', amount: 0, isNeed: true, isFixed: false, sharePercent: 0 },
  { id: 'emergency', name: 'Dana darurat', amount: 0, isNeed: true, isFixed: false, sharePercent: 5 },
  { id: 'other', name: 'Lainnya', amount: 0, isNeed: false, isFixed: false, sharePercent: 0 },
]

export const rupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0)

export function calculateMetrics(profile: FinanceProfile, categories: ExpenseCategory[], transactions: PersonalTransaction[], now = new Date()): FinanceMetrics {
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthTransactions = transactions.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`)
    return date.getFullYear() === year && date.getMonth() === month
  })
  const expenses = monthTransactions.filter((item) => item.type === 'expense')
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
  const actualSavings = monthTransactions.filter((item) => item.type === 'saving').reduce((sum, item) => sum + item.amount, 0)
  const income = monthTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
  const today = now.getDate()
  const monthDays = new Date(year, month + 1, 0).getDate()
  const dailyBurnRate = today ? totalExpenses / today : 0
  const projectedMonthlyExpenses = dailyBurnRate * monthDays
  const categoryTotals: Record<string, number> = {}
  expenses.forEach((item) => { categoryTotals[item.category] = (categoryTotals[item.category] ?? 0) + item.amount })
  const availableSpendingBudget = Math.max(0, profile.monthlyIncome - profile.monthlySavingTarget - profile.fixedExpenses)
  const effectiveIncome = income > 0 ? income : profile.monthlyIncome
  const remainingBalance = profile.openingBalance + effectiveIncome - totalExpenses - actualSavings
  const budgetUtilization = availableSpendingBudget > 0 ? (totalExpenses / availableSpendingBudget) * 100 : totalExpenses > 0 ? 100 : 0
  const savingPerformance = profile.monthlySavingTarget > 0 ? (actualSavings / profile.monthlySavingTarget) * 100 : 0
  const elapsedRatio = today / monthDays
  const aheadPercent = budgetUtilization - elapsedRatio * 100
  const burnStatus: BurnStatus = projectedMonthlyExpenses > availableSpendingBudget || (profile.monthlySavingTarget > 0 && savingPerformance < elapsedRatio * 100 * 0.5 && today > 5) ? 'CRITICAL' : aheadPercent > 10 ? 'WARNING' : 'HEALTHY'
  const categoryMap = new Map<string, number>()
  expenses.forEach((item) => categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + item.amount))
  const dailyMap = new Map<string, { expenses: number; income: number }>()
  monthTransactions.forEach((item) => {
    const label = new Date(`${item.date}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    const values = dailyMap.get(label) ?? { expenses: 0, income: 0 }
    if (item.type === 'expense') values.expenses += item.amount
    if (item.type === 'income') values.income += item.amount
    dailyMap.set(label, values)
  })
  return {
    totalExpenses, effectiveIncome, actualSavings, availableSpendingBudget, remainingBalance, dailyBurnRate,
    projectedMonthlyExpenses, savingPerformance, budgetUtilization, runwayDays: dailyBurnRate > 0 ? remainingBalance / dailyBurnRate : null,
    elapsedDays: today, monthDays, burnStatus, aheadPercent,
    categoryTotals: Array.from(categoryMap, ([name, value]) => ({ name, value })),
    dailyTotals: Array.from(dailyMap, ([label, values]) => ({ label, ...values })),
  }
}
