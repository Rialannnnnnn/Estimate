import type { Material } from '@/lib/types'
import {
  createCatalogRecommendation,
  ITEMS,
  type Period,
  type PriceObservation,
  type Priority,
} from '@/lib/recommendations'

export type NeedsGenerationChange = {
  action: 'add' | 'update' | 'remove'
  itemKey: string
  targetItemId: string | null
  name: string
  category: string
  unit: string
  quantity: number
  priority: Priority
}

export type MergeableNeedsItem = Material & {
  id?: string
  itemKey?: string
  priority?: Priority
  reason?: string
  priceSource?: 'personal-history' | 'catalogue' | 'manual'
  priceSampleCount?: number
  priceRangeMinimum?: number
  priceRangeMaximum?: number
}

export type ApplyNeedsChangesOptions = {
  period: Period
  priceHistory?: PriceObservation[]
  now?: number
}

const normalize = (value: string) => value.toLocaleLowerCase('id').replace(/\s+/g, ' ').trim()

function inferItemKey(item: MergeableNeedsItem) {
  if (item.itemKey && ITEMS[item.itemKey]) return item.itemKey
  const itemName = normalize(item.name)
  return Object.entries(ITEMS).find(([, definition]) => normalize(definition.name) === itemName)?.[0]
}

function sameIdentity(a: MergeableNeedsItem, b: MergeableNeedsItem) {
  const aKey = inferItemKey(a)
  const bKey = inferItemKey(b)
  if (aKey && bKey) {
    return aKey === bKey && normalize(a.category) === normalize(b.category)
  }
  return normalize(a.name) === normalize(b.name) && normalize(a.category) === normalize(b.category)
}

function createCustomItem(change: NeedsGenerationChange, now: number): MergeableNeedsItem {
  return {
    id: `custom-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: change.name,
    category: change.category,
    quantity: Math.max(1, Math.min(10000, Math.floor(change.quantity))),
    unitPrice: 0,
    actualPrice: null,
    isPurchased: false,
    priority: change.priority,
    reason: 'ditambahkan berdasarkan instruksi',
    priceSource: 'manual',
    priceSampleCount: 0,
  }
}

/**
 * Apply only explicit AI changes to the current list.
 * Unmentioned items are never removed or replaced.
 */
export function applyNeedsChanges(
  currentItems: MergeableNeedsItem[],
  changes: NeedsGenerationChange[],
  { period, priceHistory = [], now = Date.now() }: ApplyNeedsChangesOptions,
): MergeableNeedsItem[] {
  let next: MergeableNeedsItem[] = currentItems.map((item, index) => ({
    ...item,
    id: item.id ?? `existing-${index}-${now}`,
  }))

  for (const change of changes) {
    if (change.action === 'remove') {
      if (change.targetItemId) {
        next = next.filter((item) => item.id !== change.targetItemId)
      }
      continue
    }

    const isCatalogItem = change.itemKey !== 'custom' && Boolean(ITEMS[change.itemKey])
    const recommendation = isCatalogItem
      ? createCatalogRecommendation({
          itemKey: change.itemKey,
          period,
          quantity: change.quantity,
          unit: change.unit,
          priceHistory,
          now,
        })
      : null

    if (change.action === 'update') {
      if (!change.targetItemId) continue
      const targetIndex = next.findIndex((item) => item.id === change.targetItemId)
      if (targetIndex < 0) continue

      const current = next[targetIndex]
      if (recommendation) {
        const unitChanged = normalize(current.category) !== normalize(recommendation.category)
        next[targetIndex] = {
          ...current,
          itemKey: recommendation.itemKey,
          name: recommendation.name,
          category: recommendation.category,
          quantity: recommendation.quantity,
          unitPrice: current.priceSource === 'manual' && !unitChanged
            ? current.unitPrice
            : recommendation.unitPrice,
          actualPrice: unitChanged ? null : current.actualPrice ?? null,
          isPurchased: unitChanged ? false : current.isPurchased ?? false,
          priority: change.priority,
          ...(unitChanged ? {
            priceSource: recommendation.priceSource,
            priceSampleCount: recommendation.priceSampleCount,
            priceRangeMinimum: recommendation.priceRangeMinimum,
            priceRangeMaximum: recommendation.priceRangeMaximum,
          } : {}),
        }
      } else if (!isCatalogItem) {
        next[targetIndex] = {
          ...current,
          name: change.name,
          category: change.category,
          quantity: Math.max(1, Math.floor(change.quantity)),
          priority: change.priority,
          priceSource: 'manual',
          priceSampleCount: 0,
          priceRangeMinimum: undefined,
          priceRangeMaximum: undefined,
        }
      }
      continue
    }

    const newItem = recommendation
      ? { ...recommendation, priority: change.priority }
      : createCustomItem(change, now)
    const existingIndex = next.findIndex((item) => sameIdentity(item, newItem) && !item.isPurchased)

    if (existingIndex >= 0) {
      const existing = next[existingIndex]
      next[existingIndex] = {
        ...existing,
        quantity: Math.min(10000, Math.max(1, existing.quantity) + newItem.quantity),
        // Keep the existing price, especially when the user has adjusted it manually.
        priority: existing.priority ?? newItem.priority,
      }
    } else {
      next = [...next, newItem]
    }
  }

  return next
}
