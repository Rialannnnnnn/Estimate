export interface SearchableMaterial {
  name: string
  category: string | null
  quantity: number
  unit_price: number
  actual_price: number | null
  is_purchased: boolean
}

interface ParsedQuery {
  terms: string[]
  purchased: boolean | null
  maxPrice: number | null
  minPrice: number | null
  sort: 'asc' | 'desc' | null
}

const FILLER_WORDS = new Set(['yang', 'dan', 'barang', 'kebutuhan', 'item', 'harga', 'dengan', 'semua'])

const UNIT_MULTIPLIERS: Record<string, number> = {
  ribu: 1_000,
  rb: 1_000,
  k: 1_000,
  juta: 1_000_000,
  jt: 1_000_000,
}

const PRICE_PATTERN =
  /(di\s*bawah|dibawah|kurang\s+dari|maks(?:imal)?|<|di\s*atas|diatas|lebih\s+dari|min(?:imal)?|>)\s*(?:rp\.?\s*)?(\d+(?:[.,]\d+)*)\s*(ribu|rb|k|juta|jt)?\b/

function parseAmount(rawNumber: string, unit: string | undefined): number | null {
  let normalized: string
  if (unit) {
    normalized = rawNumber.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
  } else {
    normalized = rawNumber.replace(/[.,]/g, '')
  }
  const value = Number.parseFloat(normalized)
  if (!Number.isFinite(value)) return null
  return Math.round(value * (unit ? UNIT_MULTIPLIERS[unit] : 1))
}

export function parseSmartQuery(query: string): ParsedQuery {
  let text = query.toLocaleLowerCase('id').replace(/\s+/g, ' ').trim()
  const parsed: ParsedQuery = { terms: [], purchased: null, maxPrice: null, minPrice: null, sort: null }

  if (/(paling\s+mahal|termahal)/.test(text)) {
    parsed.sort = 'desc'
    text = text.replace(/(paling\s+mahal|termahal)/g, ' ')
  } else if (/(paling\s+murah|termurah)/.test(text)) {
    parsed.sort = 'asc'
    text = text.replace(/(paling\s+murah|termurah)/g, ' ')
  }

  if (/belum\s+(di)?beli/.test(text)) {
    parsed.purchased = false
    text = text.replace(/belum\s+(di)?beli/g, ' ')
  } else if (/(sudah|telah)\s+(di)?beli/.test(text)) {
    parsed.purchased = true
    text = text.replace(/(sudah|telah)\s+(di)?beli/g, ' ')
  }

  let priceMatch = text.match(PRICE_PATTERN)
  while (priceMatch) {
    const [fullMatch, operator, rawNumber, unit] = priceMatch
    const amount = parseAmount(rawNumber, unit)
    if (amount !== null) {
      const isUpperBound = /bawah|kurang|maks|</.test(operator)
      if (isUpperBound) parsed.maxPrice = amount
      else parsed.minPrice = amount
    }
    text = text.replace(fullMatch, ' ')
    priceMatch = text.match(PRICE_PATTERN)
  }

  parsed.terms = text
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word.length > 0 && !FILLER_WORDS.has(word))

  return parsed
}

export function getMaterialPrice(material: SearchableMaterial): number {
  return material.actual_price !== null && material.actual_price !== undefined
    ? material.actual_price
    : material.quantity * material.unit_price
}

export function smartFilterMaterials<T extends SearchableMaterial>(materials: T[], query: string): T[] {
  if (!query.trim()) return materials

  const { terms, purchased, maxPrice, minPrice, sort } = parseSmartQuery(query)

  const filtered = materials.filter((material) => {
    if (purchased !== null && material.is_purchased !== purchased) return false

    const price = getMaterialPrice(material)
    if (maxPrice !== null && price >= maxPrice) return false
    if (minPrice !== null && price <= minPrice) return false

    if (terms.length > 0) {
      const haystack = `${material.name} ${material.category ?? ''}`.toLocaleLowerCase('id')
      if (!terms.every((term) => haystack.includes(term))) return false
    }

    return true
  })

  if (sort) {
    const direction = sort === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => (getMaterialPrice(a) - getMaterialPrice(b)) * direction)
  }

  return filtered
}
