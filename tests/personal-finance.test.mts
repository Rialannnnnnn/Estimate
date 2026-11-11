import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateBurnRate,
  calculateSavingProgress,
  recommendAllocations,
  sumExpenses,
} from '../lib/personal-finance.ts'

test('recommendations total 100 percent for each profile and mindset', () => {
  for (const profile of ['student', 'worker'] as const) {
    for (const mindset of ['security', 'balance', 'enjoyment', 'growth'] as const) {
      const result = recommendAllocations(5_000_000, profile, mindset)
      assert.equal(result.reduce((sum, item) => sum + item.percentage, 0), 100)
      assert.ok(result.every((item) => item.amount >= 0))
    }
  }
})

test('burn rate projects spending using elapsed days, not total period days', () => {
  const result = calculateBurnRate({ actualExpenses: 1_000_000, spendingBudget: 2_000_000, elapsedDays: 10, totalDays: 30 })
  assert.equal(result.dailyBurnRate, 100_000)
  assert.equal(result.projectedSpending, 3_000_000)
  assert.equal(result.status, 'danger')
})

test('burn rate handles zero elapsed days and zero budget safely', () => {
  const result = calculateBurnRate({ actualExpenses: 0, spendingBudget: 0, elapsedDays: 0, totalDays: 30 })
  assert.equal(result.dailyBurnRate, 0)
  assert.equal(result.projectedSpending, 0)
  assert.equal(result.budgetUtilization, 0)
  assert.equal(result.status, 'safe')
})

test('elapsed days are clamped to period length', () => {
  const result = calculateBurnRate({ actualExpenses: 300, spendingBudget: 1_000, elapsedDays: 50, totalDays: 30 })
  assert.equal(result.daysRemaining, 0)
  assert.equal(result.projectedSpending, 300)
})

test('expenses ignore invalid and negative values', () => {
  assert.equal(sumExpenses([100, -50, Number.NaN, 200]), 300)
})

test('saving progress is safe for zero target and capped at 100', () => {
  assert.equal(calculateSavingProgress(50, 0), 0)
  assert.equal(calculateSavingProgress(150, 100), 100)
})
