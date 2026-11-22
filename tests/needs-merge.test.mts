import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyNeedsChanges, type MergeableNeedsItem, type NeedsGenerationChange } from '../lib/needs-merge.ts'

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

test('adding a new item keeps every existing item intact', () => {
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

test('custom item is added without an invented price', () => {
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
  assert.equal(item.priceSource, 'manual')
})
