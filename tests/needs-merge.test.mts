import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyNeedsChanges, applyNeedsPriceEstimates, type MergeableNeedsItem, type NeedsGenerationChange } from '../lib/needs-merge.ts'

const now = new Date('2026-11-23T00:00:00.000Z').getTime()

const existing: MergeableNeedsItem[] = [
  {
    id: 'rent-1',
    itemKey: 'sewa-kos',
    name: 'Sewa kos',
    category: 'Tempat tinggal · bulan',
    quantity: 1,
    unitPrice: 1000000,
    actualPrice: null,
    isPurchased: false,
    priceSource: 'catalogue',
    priority: 'essential',
  },
  {
    id: 'laundry-1',
    itemKey: 'laundry',
    name: 'Laundry kiloan',
    category: 'Rumah tangga · kg',
    quantity: 12,
    unitPrice: 8000,
    actualPrice: null,
    isPurchased: false,
    priceSource: 'manual',
    priority: 'essential',
  },
]

const addEggs: NeedsGenerationChange = {
  action: 'add',
  itemKey: 'telur',
  targetItemId: null,
  name: 'Telur ayam',
  category: 'Bahan makanan',
  unit: 'kg',
  quantity: 2,
  priority: 'essential',
}

test('AI estimate is applied directly to a matching existing unpriced item', () => {\n  const unpriced: MergeableNeedsItem[] = [{\n    id: 'scissors-1', name: 'Gunting', category: 'Kuliah & Tugas · pcs',\n    quantity: 1, unitPrice: 0, actualPrice: null, isPurchased: false,\n    priceSource: 'unpriced', priority: 'essential',\n  }]\n  const result = applyNeedsPriceEstimates(unpriced, [{\n    targetItemId: 'scissors-1', estimatedUnitPrice: 15000,\n    estimatedPriceMin: 10000, estimatedPriceMax: 25000,\n  }], { now })\n  assert.equal(result[0].unitPrice, 15000)\n  assert.equal(result[0].priceSource, 'ai-estimate')\n  assert.equal(result[0].priceRangeMinimum, 10000)\n  assert.equal(result[0].priceRangeMaximum, 25000)\n  assert.equal(result[0].actualPrice, null)\n  assert.equal(result[0].isPurchased, false)\n})\n\ntest('AI estimate never overwrites an existing price or a purchased item', () => {\n  const rows: MergeableNeedsItem[] = [\n    { id: 'manual-1', name: 'Tas', category: 'Kuliah & Tugas · pcs', quantity: 1, unitPrice: 200000, actualPrice: null, isPurchased: false, priceSource: 'manual' },\n    { id: 'bought-1', name: 'Buku', category: 'Kuliah & Tugas · pcs', quantity: 1, unitPrice: 0, actualPrice: 18000, isPurchased: true },\n  ]\n  const result = applyNeedsPriceEstimates(rows, [\n    { targetItemId: 'manual-1', estimatedUnitPrice: 100000, estimatedPriceMin: 80000, estimatedPriceMax: 120000 },\n    { targetItemId: 'bought-1', estimatedUnitPrice: 20000, estimatedPriceMin: 15000, estimatedPriceMax: 25000 },\n  ], { now })\n  assert.equal(result[0].unitPrice, 200000)\n  assert.equal(result[0].priceSource, 'manual')\n  assert.equal(result[1].unitPrice, 0)\n  assert.equal(result[1].isPurchased, true)\n})\n\ntest('adding a new item keeps every existing item intact', () => {
  const result = applyNeedsChanges(existing, [addEggs], { period: 'monthly', now })
  assert.equal(result.length, 3)
  assert.deepEqual(result.slice(0, 2), existing.map((item, index) => ({ ...item, id: item.id ?? `existing-${index}-${now}` })))
  const eggs = result.find((item) => item.itemKey === 'telur')
  assert.ok(eggs)
  assert.equal(eggs.quantity, 2)
  assert.equal(eggs.category, 'Bahan makanan · kg')
  assert.equal(eggs.unitPrice, 30000)
})

test('adding the same item and same unit increments quantity without duplicating the row', () => {
  const withEggs: MergeableNeedsItem[] = [{
    id: 'eggs-1',
    itemKey: 'telur',
    name: 'Telur ayam',
    category: 'Bahan makanan · kg',
    quantity: 1,
    unitPrice: 30000,
    actualPrice: null,
    isPurchased: false,
    priceSource: 'manual',
    priority: 'essential',
  }]
  const result = applyNeedsChanges(withEggs, [addEggs], { period: 'monthly', now })
  assert.equal(result.length, 1)
  assert.equal(result[0].quantity, 3)
  assert.equal(result[0].unitPrice, 30000)
  assert.equal(result[0].priceSource, 'manual')
})

test('update changes only the targeted item and preserves other rows', () => {
  const update: NeedsGenerationChange = {
    action: 'update',
    itemKey: 'laundry',
    targetItemId: 'laundry-1',
    name: 'Laundry kiloan',
    category: 'Rumah tangga',
    unit: 'kg',
    quantity: 8,
    priority: 'essential',
  }
  const result = applyNeedsChanges(existing, [update], { period: 'monthly', now })
  assert.equal(result.length, 2)
  assert.equal(result.find((item) => item.id === 'rent-1')?.quantity, 1)
  assert.equal(result.find((item) => item.id === 'laundry-1')?.quantity, 8)
})

test('remove affects only the explicitly targeted item id', () => {
  const remove: NeedsGenerationChange = {
    action: 'remove',
    itemKey: 'sewa-kos',
    targetItemId: 'rent-1',
    name: 'Sewa kos',
    category: 'Tempat tinggal',
    unit: 'bulan',
    quantity: 1,
    priority: 'essential',
  }
  const result = applyNeedsChanges(existing, [remove], { period: 'monthly', now })
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 'laundry-1')
})

test('unknown catalog unit is not silently priced using another unit', () => {
  const wrongUnit = { ...addEggs, unit: 'dus' }
  const result = applyNeedsChanges([], [wrongUnit], { period: 'monthly', now })
  assert.equal(result.length, 0)
})

test('custom item without a valid AI estimate remains clearly unpriced as a safe fallback', () => {
  const custom: NeedsGenerationChange = {
    action: 'add',
    itemKey: 'custom',
    targetItemId: null,
    name: 'Buah naga',
    category: 'Bahan makanan · kg',
    unit: 'kg',
    quantity: 1,
    priority: 'optional',
  }
  const result = applyNeedsChanges(existing, [custom], { period: 'monthly', now })
  assert.equal(result.length, 3)
  const item = result.find((entry) => entry.name === 'Buah naga')
  assert.ok(item)
  assert.equal(item.unitPrice, 0)
  assert.equal(item.priceSource, 'unpriced')
})

test('custom item receives an editable average AI unit-price estimate and range', () => {
  const custom: NeedsGenerationChange = {
    action: 'add', itemKey: 'custom', targetItemId: null,
    name: 'Gunting', category: 'Alat & Bahan', unit: 'pcs',
    quantity: 1, priority: 'essential',
    estimatedUnitPrice: 10000, estimatedPriceMin: 8000, estimatedPriceMax: 15000,
  }
  const result = applyNeedsChanges([], [custom], { period: 'monthly', now })
  assert.equal(result.length, 1)
  assert.equal(result[0].unitPrice, 10000)
  assert.equal(result[0].priceSource, 'ai-estimate')
  assert.equal(result[0].priceRangeMinimum, 8000)
  assert.equal(result[0].priceRangeMaximum, 15000)
  assert.equal(result[0].actualPrice, null)
  assert.equal(result[0].isPurchased, false)
})

test('explicit user price overrides the AI estimate', () => {
  const custom: NeedsGenerationChange = {
    action: 'add', itemKey: 'custom', targetItemId: null,
    name: 'Gunting', category: 'Alat & Bahan', unit: 'pcs',
    quantity: 1, priority: 'essential', userProvidedUnitPrice: 12000,
    estimatedUnitPrice: 10000, estimatedPriceMin: 8000, estimatedPriceMax: 15000,
  }
  const result = applyNeedsChanges([], [custom], { period: 'monthly', now })
  assert.equal(result[0].unitPrice, 12000)
  assert.equal(result[0].priceSource, 'manual')
  assert.equal(result[0].priceRangeMinimum, undefined)
})

test('custom item uses personal purchase history before the AI estimate', () => {
  const custom: NeedsGenerationChange = {
    action: 'add', itemKey: 'custom', targetItemId: null,
    name: 'Gunting', category: 'Alat & Bahan', unit: 'pcs',
    quantity: 1, priority: 'essential',
    estimatedUnitPrice: 10000, estimatedPriceMin: 8000, estimatedPriceMax: 15000,
  }
  const result = applyNeedsChanges([], [custom], {
    period: 'monthly', now,
    priceHistory: [
      { name: 'Gunting', category: 'Alat & Bahan · pcs', actualPrice: 9000, recordedAt: '2026-10-01T00:00:00.000Z' },
      { name: 'Gunting', category: 'Alat & Bahan · pcs', actualPrice: 10000, recordedAt: '2026-10-02T00:00:00.000Z' },
      { name: 'Gunting', category: 'Alat & Bahan · pcs', actualPrice: 11000, recordedAt: '2026-10-03T00:00:00.000Z' },
    ],
  })
  assert.equal(result[0].unitPrice, 10000)
  assert.equal(result[0].priceSource, 'personal-history')
  assert.equal(result[0].priceSampleCount, 3)
  assert.equal(result[0].priceRangeMinimum, 9000)
  assert.equal(result[0].priceRangeMaximum, 11000)
})

test('catalog item uses AI estimate when personal history is unavailable', () => {
  const result = applyNeedsChanges([], [{
    ...addEggs, estimatedUnitPrice: 35000,
    estimatedPriceMin: 30000, estimatedPriceMax: 42000,
  }], { period: 'monthly', now })
  const eggs = result.find((item) => item.itemKey === 'telur')
  assert.ok(eggs)
  assert.equal(eggs.unitPrice, 35000)
  assert.equal(eggs.priceSource, 'ai-estimate')
  assert.equal(eggs.priceRangeMinimum, 30000)
  assert.equal(eggs.priceRangeMaximum, 42000)
})

test('personal purchase history has priority over an AI estimate', () => {
  const result = applyNeedsChanges([], [{
    ...addEggs, estimatedUnitPrice: 35000,
    estimatedPriceMin: 30000, estimatedPriceMax: 42000,
  }], {
    period: 'monthly', now,
    priceHistory: [
      { name: 'Telur ayam', category: 'Bahan makanan · kg', actualPrice: 32000, recordedAt: '2026-10-01T00:00:00.000Z' },
      { name: 'Telur ayam', category: 'Bahan makanan · kg', actualPrice: 34000, recordedAt: '2026-10-02T00:00:00.000Z' },
      { name: 'Telur ayam', category: 'Bahan makanan · kg', actualPrice: 36000, recordedAt: '2026-10-03T00:00:00.000Z' },
    ],
  })
  const eggs = result.find((item) => item.itemKey === 'telur')
  assert.ok(eggs)
  assert.equal(eggs.unitPrice, 34000)
  assert.equal(eggs.priceSource, 'personal-history')
})

test('recurrent meal uses the stated frequency, days and unit price', () => {
  const meal: NeedsGenerationChange = {
    action: 'add',
    itemKey: 'custom',
    targetItemId: null,
    name: 'Makan',
    category: 'Makanan & Minuman',
    unit: 'porsi',
    quantity: 90,
    priority: 'essential',
    userProvidedUnitPrice: 25000,
    dailyFrequency: 3,
    periodDays: 30,
  }
  const result = applyNeedsChanges([], [meal], { period: 'monthly', now })
  assert.equal(result.length, 1)
  assert.equal(result[0].quantity, 90)
  assert.equal(result[0].unitPrice, 25000)
  assert.equal(result[0].category, 'Makanan & Minuman · porsi')
  assert.equal(result[0].dailyFrequency, 3)
  assert.equal(result[0].periodDays, 30)
  assert.equal(result[0].quantity * result[0].unitPrice, 2250000)
})

test('a project can produce separate wood and glue materials without invented prices', () => {
  const projectMaterials: NeedsGenerationChange[] = [
    {
      action: 'add', itemKey: 'custom', targetItemId: null,
      name: 'Kayu', category: 'Perlengkapan Proyek', unit: 'batang',
      quantity: 4, priority: 'essential',
    },
    {
      action: 'add', itemKey: 'custom', targetItemId: null,
      name: 'Lem kayu', category: 'Perlengkapan Proyek', unit: 'botol',
      quantity: 1, priority: 'essential',
    },
  ]
  const result = applyNeedsChanges([], projectMaterials, { period: 'monthly', now })
  assert.equal(result.length, 2)
  assert.equal(result[0].name, 'Kayu')
  assert.equal(result[1].name, 'Lem kayu')
  assert.equal(result[0].unitPrice, 0)
  assert.equal(result[1].unitPrice, 0)
  assert.notEqual(result[0].category, result[1].category)
})

test('adding more of a recurring item preserves and combines its recurrence', () => {
  const existingMeal: MergeableNeedsItem[] = [{
    id: 'meal-1',
    name: 'Makan',
    category: 'Makanan & Minuman · porsi',
    quantity: 90,
    unitPrice: 25000,
    actualPrice: null,
    isPurchased: false,
    dailyFrequency: 3,
    periodDays: 30,
    priority: 'essential',
  }]
  const extraMeal: NeedsGenerationChange = {
    action: 'add', itemKey: 'custom', targetItemId: null,
    name: 'Makan', category: 'Makanan & Minuman', unit: 'porsi',
    quantity: 30, priority: 'essential',
    dailyFrequency: 1, periodDays: 30,
  }
  const result = applyNeedsChanges(existingMeal, [extraMeal], { period: 'monthly', now })
  assert.equal(result.length, 1)
  assert.equal(result[0].quantity, 120)
  assert.equal(result[0].dailyFrequency, 4)
  assert.equal(result[0].periodDays, 30)
  assert.equal(result[0].unitPrice, 25000)
})
