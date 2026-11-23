import type { Material } from './types.ts'
import {
  createCatalogRecommendation,
  estimatePersonalUnitPrice,
  ITEMS,
  type Period,
  type PriceObservation,
  type Priority,
} from './recommendations.ts'

export type NeedsGenerationChange = {
  action: 'add' | 'update' | 'remove'
  itemKey: string
  targetItemId: string | null
  name: string
  category: string
  unit: string
  quantity: number
  priority: Priority
  userProvidedUnitPrice?: number | null
  estimatedUnitPrice?: number | null
  estimatedPriceMin?: number | null
  estimatedPriceMax?: number | null
  dailyFrequency?: number | null
  periodDays?: number | null
}

export type NeedsPriceEstimate = {
  targetItemId: string
  estimatedUnitPrice: number
  estimatedPriceMin: number
  estimatedPriceMax: number
}

export type MergeableNeedsItem = Material & {
  id?: string
  itemKey?: string
  priority?: Priority
  reason?: string
  priceSource?: 'personal-history' | 'catalogue' | 'manual' | 'ai-estimate' | 'unpriced'
  priceSampleCount?: number
  priceRangeMinimum?: number
  priceRangeMaximum?: number
  dailyFrequency?: number
  periodDays?: number
}

export type ApplyNeedsChangesOptions = {
  period: Period
  priceHistory?: PriceObservation[]
  now?: number
}

export function applyNeedsPriceEstimates(
  currentItems: MergeableNeedsItem[],
  estimates: NeedsPriceEstimate[],
  { priceHistory = [], now = Date.now() }: Pick<ApplyNeedsChangesOptions, 'priceHistory' | 'now'> = {},
): MergeableNeedsItem[] {
  if (estimates.length === 0) return currentItems

  const estimateById = new Map(estimates.map((estimate) => [estimate.targetItemId, estimate]))
  return currentItems.map((item) => {
    const estimate = item.id ? estimateById.get(item.id) : undefined
    // Never replace a user-entered price, an existing catalogue price, a purchased item or an actual price.
    if (!estimate || item.unitPrice > 0 || item.isPurchased || item.actualPrice != null) return item
    if (!Number.isFinite(estimate.estimatedUnitPrice) || estimate.estimatedUnitPrice <= 0) return item

    const personalPrice = estimatePersonalUnitPrice(item.name, item.category, priceHistory, now)
    if (personalPrice) {
      return {
        ...item,
        unitPrice: personalPrice.median,
        priceSource: 'personal-history' as const,
        priceSampleCount: personalPrice.sampleCount,
        priceRangeMinimum: personalPrice.minimum,
        priceRangeMaximum: personalPrice.maximum,
      }
    }

    return {
      ...item,
      unitPrice: Math.round(estimate.estimatedUnitPrice),
      priceSource: 'ai-estimate' as const,
      priceSampleCount: 0,
      priceRangeMinimum: Math.max(1, Math.min(Math.round(estimate.estimatedPriceMin), Math.round(estimate.estimatedUnitPrice))),
      priceRangeMaximum: Math.max(Math.round(estimate.estimatedPriceMax), Math.round(estimate.estimatedUnitPrice)),
    }
  })
}

const normalize = (value: string) => value.toLocaleLowerCase('id').replace(/\s+/g, ' ').trim()
const knownUnits = new Set(['pcs', 'buah', 'unit', 'porsi', 'butir', 'kg', 'gram', 'gr', 'liter', 'ml', 'botol', 'lembar', 'batang', 'meter', 'cm', 'm²', 'm2', 'tube', 'pack', 'paket', 'roll', 'set', 'kali', 'hari', 'bulan', 'perjalanan', 'galon', 'tabung', 'bungkus', 'kaleng', 'pasang', 'box', 'rim', 'jam', 'gelas', 'token', 'pouch', 'karung 5 kg', 'ikat', 'bungkus isi 10', 'papan', 'strip', 'orang', 'malam', 'tiket', 'setoran', 'alokasi', 'lbr', 'halaman', 'hal', 'eksemplar', 'rangkap', 'cup', 'trip', 'l', 'kilo', 'bks', 'karung', 'btr', 'potong'])

function categoryParts(category: string, fallbackUnit = 'pcs') {
  const parts = category.split(' · ')
  const possibleUnit = normalize(parts[parts.length - 1])
  if (parts.length > 1 && knownUnits.has(possibleUnit)) {
    return { category: parts.slice(0, -1).join(' · '), unit: possibleUnit }
  }
  return { category, unit: fallbackUnit }
}

function inferItemKey(item: MergeableNeedsItem) {
  if (item.itemKey && ITEMS[item.itemKey]) return item.itemKey
  const itemName = normalize(item.name)
  return Object.entries(ITEMS).find(([, definition]) => normalize(definition.name) === itemName)?.[0]
}

function sameIdentity(a: MergeableNeedsItem, b: MergeableNeedsItem) {
  const aKey = inferItemKey(a)
  const bKey = inferItemKey(b)
  const aUnit = categoryParts(a.category, aKey ? ITEMS[aKey].unit : 'pcs').unit
  const bUnit = categoryParts(b.category, bKey ? ITEMS[bKey].unit : 'pcs').unit
  const sameUnit = aUnit === bUnit

  if (aKey && bKey) return aKey === bKey && sameUnit
  const aCategory = categoryParts(a.category, aUnit).category
  const bCategory = categoryParts(b.category, bUnit).category
  return normalize(a.name) === normalize(b.name)
    && normalize(aCategory) === normalize(bCategory)
    && sameUnit
}

function createCustomItem(change: NeedsGenerationChange, now: number, priceHistory: PriceObservation[]): MergeableNeedsItem {
  const personalPrice = estimatePersonalUnitPrice(
    change.name,
    `${change.category} · ${change.unit}`,
    priceHistory,
    now,
  )
  const hasUserPrice = change.userProvidedUnitPrice != null && change.userProvidedUnitPrice > 0
  const hasPersonalPrice = !hasUserPrice && personalPrice != null
  const hasAiEstimate = !hasUserPrice && !hasPersonalPrice && change.estimatedUnitPrice != null && change.estimatedUnitPrice > 0
  const unitPrice = hasUserPrice
    ? change.userProvidedUnitPrice!
    : hasPersonalPrice
      ? personalPrice!.median
      : hasAiEstimate
        ? change.estimatedUnitPrice!
        : 0

  return {
    id: `custom-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: change.name,
    category: `${change.category} · ${change.unit}`,
    quantity: Math.max(1, Math.min(10000, Math.floor(change.quantity))),
    unitPrice,
    actualPrice: null,
    isPurchased: false,
    priority: change.priority,
    reason: 'ditambahkan berdasarkan instruksi',
    priceSource: hasUserPrice ? 'manual' : hasPersonalPrice ? 'personal-history' : hasAiEstimate ? 'ai-estimate' : 'unpriced',
    priceSampleCount: personalPrice?.sampleCount ?? 0,
    ...(hasPersonalPrice ? {
      priceRangeMinimum: personalPrice!.minimum,
      priceRangeMaximum: personalPrice!.maximum,
    } : hasAiEstimate ? {
      priceRangeMinimum: change.estimatedPriceMin ?? undefined,
      priceRangeMaximum: change.estimatedPriceMax ?? undefined,
    } : {}),
    ...(change.dailyFrequency && change.periodDays ? {
      dailyFrequency: change.dailyFrequency,
      periodDays: change.periodDays,
    } : {}),
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

    // A known catalog item with an unsupported unit must never fall through as a custom item.
    if (isCatalogItem && !recommendation) continue

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
          unitPrice: change.userProvidedUnitPrice != null && change.userProvidedUnitPrice > 0
            ? change.userProvidedUnitPrice
            : !unitChanged && current.unitPrice > 0
              ? current.unitPrice
              : recommendation.unitPrice,
          actualPrice: unitChanged ? null : current.actualPrice ?? null,
          isPurchased: unitChanged ? false : current.isPurchased ?? false,
          priority: change.priority,
          ...(change.userProvidedUnitPrice != null && change.userProvidedUnitPrice > 0 ? {
            unitPrice: change.userProvidedUnitPrice,
            priceSource: 'manual' as const,
            priceSampleCount: 0,
            priceRangeMinimum: undefined,
            priceRangeMaximum: undefined,
          } : {}),
          ...(change.dailyFrequency && change.periodDays ? {
            dailyFrequency: change.dailyFrequency,
            periodDays: change.periodDays,
          } : {}),
          ...(unitChanged && !(change.userProvidedUnitPrice != null && change.userProvidedUnitPrice > 0) ? {
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
          category: `${change.category} · ${change.unit}`,
          quantity: Math.max(1, Math.floor(change.quantity)),
          priority: change.priority,
          unitPrice: change.userProvidedUnitPrice != null && change.userProvidedUnitPrice > 0
            ? change.userProvidedUnitPrice
            : current.unitPrice,
          priceSource: change.userProvidedUnitPrice != null && change.userProvidedUnitPrice > 0
            ? 'manual'
            : current.priceSource ?? (current.unitPrice > 0 ? 'catalogue' : 'unpriced'),
          ...(change.userProvidedUnitPrice != null && change.userProvidedUnitPrice > 0 ? {
            priceSampleCount: 0,
            priceRangeMinimum: undefined,
            priceRangeMaximum: undefined,
          } : {}),
          dailyFrequency: change.dailyFrequency ?? undefined,
          periodDays: change.periodDays ?? undefined,
        }
      }
      continue
    }

    const hasUserPrice = change.userProvidedUnitPrice != null && change.userProvidedUnitPrice > 0
    const hasAiEstimate = !hasUserPrice && change.estimatedUnitPrice != null && change.estimatedUnitPrice > 0
      && recommendation?.priceSource !== 'personal-history'
    const newItem = recommendation
      ? {
          ...recommendation,
          priority: change.priority,
          ...(hasUserPrice ? {
            unitPrice: change.userProvidedUnitPrice!,
            priceSource: 'manual' as const,
            priceSampleCount: 0,
            priceRangeMinimum: undefined,
            priceRangeMaximum: undefined,
          } : hasAiEstimate ? {
            unitPrice: change.estimatedUnitPrice!,
            priceSource: 'ai-estimate' as const,
            priceSampleCount: 0,
            priceRangeMinimum: change.estimatedPriceMin ?? undefined,
            priceRangeMaximum: change.estimatedPriceMax ?? undefined,
          } : {}),
          ...(change.dailyFrequency && change.periodDays ? {
            dailyFrequency: change.dailyFrequency,
            periodDays: change.periodDays,
          } : {}),
        }
      : createCustomItem(change, now, priceHistory)
    const existingIndex = next.findIndex((item) => sameIdentity(item, newItem) && !item.isPurchased)

    if (existingIndex >= 0) {
      const existing = next[existingIndex]
      const sameRecurrencePeriod = existing.periodDays != null
        && newItem.periodDays != null
        && existing.periodDays === newItem.periodDays
      next[existingIndex] = {
        ...existing,
        quantity: Math.min(10000, Math.max(1, existing.quantity) + newItem.quantity),
        // User-provided prices replace prior estimates; otherwise preserve an existing nonzero price.
        unitPrice: newItem.priceSource === 'manual' && newItem.unitPrice > 0
          ? newItem.unitPrice
          : existing.unitPrice > 0
            ? existing.unitPrice
            : newItem.unitPrice,
        ...(newItem.priceSource === 'manual' && newItem.unitPrice > 0
          ? { priceSource: 'manual' as const, priceSampleCount: 0, priceRangeMinimum: undefined, priceRangeMaximum: undefined }
          : existing.unitPrice <= 0
            ? {
                priceSource: newItem.priceSource,
                priceSampleCount: newItem.priceSampleCount,
                priceRangeMinimum: newItem.priceRangeMinimum,
                priceRangeMaximum: newItem.priceRangeMaximum,
              }
            : {}),
        priority: existing.priority ?? newItem.priority,
        ...(sameRecurrencePeriod && existing.dailyFrequency && newItem.dailyFrequency
          ? { dailyFrequency: Math.min(24, existing.dailyFrequency + newItem.dailyFrequency), periodDays: existing.periodDays }
          : newItem.dailyFrequency && newItem.periodDays && !existing.dailyFrequency
            ? { dailyFrequency: newItem.dailyFrequency, periodDays: newItem.periodDays }
            : existing.dailyFrequency || newItem.dailyFrequency
              ? { dailyFrequency: undefined, periodDays: undefined }
              : {}),
      }
    } else {
      next = [...next, newItem]
    }
  }

  return next
}
