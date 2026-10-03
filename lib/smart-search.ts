export interface SearchableMaterial {
  name: string
  category: string | null
  quantity: number
  unit_price: number
  actual_price: number | null
  is_purchased: boolean
}

export interface ParsedQuery {
  terms: string[]
  purchased: boolean | null
  maxPrice: number | null
  minPrice: number | null
  maxInclusive: boolean
  minInclusive: boolean
  sort: 'asc' | 'desc' | null
}

const FILLER_WORDS = new Set([
  'yang', 'yg', 'dong', 'donk', 'coba', 'cari', 'carikan', 'tampilkan', 'tampilin', 'tunjukkan', 'lihat', 'liat',
  'kebutuhan', 'barang', 'item', 'harga', 'aku', 'saya', 'gue', 'gw', 'dengan', 'dgn', 'dan', 'semua', 'mau',
  'tolong', 'aja', 'saja', 'dari', 'ke', 'paling', 'urutkan', 'urut', 'status', 'rp', 'ribu', 'rb', 'juta', 'jt',
  'nya', 'ya', 'yah', 'deh', 'sih', 'untuk', 'buat', 'di', 'yang',
])

const WORD_ALIASES: Record<string, string> = {
  blm: 'belum',
  blum: 'belum',
  belom: 'belum',
  udh: 'sudah',
  udah: 'sudah',
  sdh: 'sudah',
  dah: 'sudah',
  tlh: 'telah',
  beli: 'dibeli',
  kebeli: 'dibeli',
  dibeliin: 'dibeli',
  dibelikan: 'dibeli',
  terbeli: 'dibeli',
  dbeli: 'dibeli',
  dibwah: 'dibawah',
  dbawah: 'dibawah',
  dibawh: 'dibawah',
  dbwh: 'dibawah',
  dibwh: 'dibawah',
  diats: 'diatas',
  datas: 'diatas',
  dats: 'diatas',
  krg: 'kurang',
  kurg: 'kurang',
  lbh: 'lebih',
  maks: 'maksimal',
  max: 'maksimal',
  maximal: 'maksimal',
  maksimum: 'maksimal',
  min: 'minimal',
  minimum: 'minimal',
  mahall: 'mahal',
  murahh: 'murah',
  ribuan: 'ribu',
  rebu: 'ribu',
}

// Only long, distinctive keywords get edit-distance matching so short product names are never rewritten.
const FUZZY_KEYWORDS = [
  'dibawah', 'diatas', 'termurah', 'termahal', 'tertinggi', 'terendah', 'maksimal', 'minimal', 'kurang', 'lebih',
  'belum', 'sudah', 'dibeli', 'urutkan',
]

const UNIT_MULTIPLIERS: Record<string, number> = {
  ribu: 1_000,
  rb: 1_000,
  k: 1_000,
  juta: 1_000_000,
  jt: 1_000_000,
  m: 1_000_000,
}

const PRICE_PATTERN =
  /(?:^|\s)(dibawah|kurang dari|kurang|maksimal|<=|<|diatas|lebih dari|lebih|minimal|>=|>)\s*(?:rp\s*)?(\d+(?:[.,]\d+)*)\s*(ribu|rb|k|juta|jt|m)?(?=\s|$)/

// Bare numbers below this are read as thousands ("dibawah 100" = Rp100.000), matching how Indonesian shoppers abbreviate prices.
const IMPLICIT_THOUSANDS_LIMIT = 1_000

const SORT_DESC_PATTERN = /(paling mahal|termahal|harga tertinggi|tertinggi|urutkan dari mahal|dari mahal|mahal ke murah)/g
const SORT_ASC_PATTERN = /(paling murah|termurah|harga terendah|terendah|urutkan dari murah|dari murah|murah ke mahal)/g
const NOT_PURCHASED_PATTERN = /belum (?:sudah |di)?dibeli/g
const PURCHASED_PATTERN = /(?:sudah|telah) dibeli/g

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0]
    previous[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j]
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return previous[b.length]
}

function canonicalizeWord(word: string): string {
  if (WORD_ALIASES[word]) return WORD_ALIASES[word]
  if (/\d/.test(word) || word.length < 5) return word

  const collapsed = word.replace(/([a-z])\1+/g, '$1')
  if (WORD_ALIASES[collapsed]) return WORD_ALIASES[collapsed]
  if (FUZZY_KEYWORDS.includes(collapsed)) return collapsed

  for (const keyword of FUZZY_KEYWORDS) {
    if (keyword.length >= 6 && editDistance(collapsed, keyword) <= 1) return keyword
  }
  return word
}

function normalizeQuery(query: string): string {
  const spaced = query
    .toLocaleLowerCase('id')
    .replace(/(^|[^a-z])rp\.?(?=\s|\d|$)/g, '$1 rp ')
    .replace(/(<=|>=|<|>)/g, ' $1 ')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/[^\p{L}\p{N}<>=.,\s]/gu, ' ')
    .replace(/(?<!\d)[.,]|[.,](?!\d)/g, ' ')

  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map(canonicalizeWord)
    .join(' ')
    .replace(/\bdi (bawah|atas)\b/g, 'di$1')
    .replace(/\bbelum di dibeli\b/g, 'belum dibeli')
}

function parseAmount(rawNumber: string, unit: string | undefined): number | null {
  if (unit) {
    const normalized = rawNumber.replace(/\.(?=\d{3}(?!\d))/g, '').replace(',', '.')
    const value = Number.parseFloat(normalized)
    if (!Number.isFinite(value)) return null
    return Math.round(value * UNIT_MULTIPLIERS[unit])
  }

  const isThousandsGrouped = /^\d{1,3}([.,]\d{3})+$/.test(rawNumber)
  const normalized = isThousandsGrouped ? rawNumber.replace(/[.,]/g, '') : rawNumber.replace(',', '.')
  const value = Number.parseFloat(normalized)
  if (!Number.isFinite(value)) return null
  if (value < IMPLICIT_THOUSANDS_LIMIT) return Math.round(value * 1_000)
  return Math.round(value)
}

export function parseSmartQuery(query: string): ParsedQuery {
  let text = ` ${normalizeQuery(query)} `
  const parsed: ParsedQuery = {
    terms: [],
    purchased: null,
    maxPrice: null,
    minPrice: null,
    maxInclusive: false,
    minInclusive: false,
    sort: null,
  }

  if (SORT_DESC_PATTERN.test(text)) {
    parsed.sort = 'desc'
    text = text.replace(SORT_DESC_PATTERN, ' ')
  } else if (SORT_ASC_PATTERN.test(text)) {
    parsed.sort = 'asc'
    text = text.replace(SORT_ASC_PATTERN, ' ')
  }
  SORT_DESC_PATTERN.lastIndex = 0
  SORT_ASC_PATTERN.lastIndex = 0

  if (NOT_PURCHASED_PATTERN.test(text)) {
    parsed.purchased = false
    text = text.replace(NOT_PURCHASED_PATTERN, ' ')
  } else if (PURCHASED_PATTERN.test(text)) {
    parsed.purchased = true
    text = text.replace(PURCHASED_PATTERN, ' ')
  }
  NOT_PURCHASED_PATTERN.lastIndex = 0
  PURCHASED_PATTERN.lastIndex = 0

  let priceMatch = text.match(PRICE_PATTERN)
  while (priceMatch) {
    const [fullMatch, operator, rawNumber, unit] = priceMatch
    const amount = parseAmount(rawNumber, unit)
    if (amount !== null) {
      const isInclusive = operator === 'maksimal' || operator === 'minimal' || operator.includes('=')
      if (/bawah|kurang|maksimal|</.test(operator)) {
        parsed.maxPrice = amount
        parsed.maxInclusive = isInclusive
      } else {
        parsed.minPrice = amount
        parsed.minInclusive = isInclusive
      }
    }
    text = text.replace(fullMatch, ' ')
    priceMatch = text.match(PRICE_PATTERN)
  }

  parsed.terms = text
    .split(/\s+/)
    .filter((word) => word.length > 0 && !FILLER_WORDS.has(word) && !/^[<>=.,]+$/.test(word))

  return parsed
}

export function getMaterialPrice(material: SearchableMaterial): number {
  return material.actual_price !== null && material.actual_price !== undefined
    ? material.actual_price
    : material.quantity * material.unit_price
}

export function smartFilterMaterials<T extends SearchableMaterial>(materials: T[], query: string): T[] {
  if (!query.trim()) return materials

  const { terms, purchased, maxPrice, minPrice, maxInclusive, minInclusive, sort } = parseSmartQuery(query)

  const filtered = materials.filter((material) => {
    if (purchased !== null && material.is_purchased !== purchased) return false

    const price = getMaterialPrice(material)
    if (maxPrice !== null && (maxInclusive ? price > maxPrice : price >= maxPrice)) return false
    if (minPrice !== null && (minInclusive ? price < minPrice : price <= minPrice)) return false

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
