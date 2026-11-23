import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateActualTotal,
  calculateEstimatedTotal,
  calculateProjectedTotal,
  calculateRemainingBudget,
  formatCurrencyInput,
  parseCurrencyInput,
  getBudgetStatus,
} from '../lib/budget.ts'
import type { Material } from '../lib/types.ts'

const materials: Material[] = [
  { name: 'Makan', category: 'Makan', quantity: 1, unitPrice: 35000, isPurchased: true, actualPrice: 32000 },
  { name: 'Transportasi', category: 'Transportasi', quantity: 2, unitPrice: 8000, isPurchased: true, actualPrice: 10000 },
  { name: 'Air mineral', category: 'Minum', quantity: 2, unitPrice: 4000, isPurchased: false, actualPrice: null },
]

test('estimated total multiplies each unit price by quantity', () => {
  assert.equal(calculateEstimatedTotal(materials), 59000)
})

test('actual total includes only purchased items with an actual price and multiplies quantity', () => {
  assert.equal(calculateActualTotal(materials), 52000)
})

test('projected total uses actual prices for recorded purchases and estimates for the rest', () => {
  assert.equal(calculateProjectedTotal(materials), 60000)
})

test('remaining budget is based on projected total, not only realized purchases', () => {
  assert.equal(calculateRemainingBudget(100000, materials), 40000)
})

test('an item marked purchased without actual price is excluded from actuals but keeps its estimate in projection', () => {
  const pendingActual: Material[] = [
    { name: 'Bensin', category: 'Transportasi', quantity: 2, unitPrice: 12000, isPurchased: true, actualPrice: null },
  ]

  assert.equal(calculateActualTotal(pendingActual), 0)
  assert.equal(calculateProjectedTotal(pendingActual), 24000)
})

test('unchecking a purchased item excludes it from actuals but does not erase its saved actual price', () => {
  const unchecked: Material[] = [
    { name: 'Makan', category: 'Makan', quantity: 1, unitPrice: 35000, isPurchased: false, actualPrice: 32000 },
  ]

  assert.equal(calculateActualTotal(unchecked), 0)
  assert.equal(calculateProjectedTotal(unchecked), 35000)
  assert.equal(unchecked[0].actualPrice, 32000)
})

test('budget status uses projected spending thresholds', () => {
  assert.equal(getBudgetStatus(79000, 100000), 'safe')
  assert.equal(getBudgetStatus(80000, 100000), 'warning')
  assert.equal(getBudgetStatus(100001, 100000), 'danger')
})

test('rupiah input formats thousands with Indonesian separators', () => {
  assert.equal(formatCurrencyInput('35000'), '35.000')
  assert.equal(formatCurrencyInput('1250000'), '1.250.000')
  assert.equal(formatCurrencyInput('Rp 1.250.000'), '1.250.000')
  assert.equal(formatCurrencyInput('00035000'), '35.000')
  assert.equal(formatCurrencyInput(''), '')
})

test('rupiah parser converts formatted values back into exact integer amounts', () => {
  assert.equal(parseCurrencyInput('35.000'), 35000)
  assert.equal(parseCurrencyInput('1.250.000'), 1250000)
  assert.equal(parseCurrencyInput('Rp 75.000'), 75000)
})
