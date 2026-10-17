// Development-only fixtures for the rule-based generator. Run: pnpm test:recommendations
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeBudget, generateRecommendations, itemTotal, ITEMS } from '../lib/recommendations.ts'

const keys = (result: ReturnType<typeof generateRecommendations>) => result.items.map((item) => item.itemKey)

const fixtures = {
  designStudent: {
    templateType: 'kuliah-kerja' as const,
    period: 'monthly' as const,
    description: 'Aku mahasiswa desain semester 3. Bulan ini banyak tugas maket, presentasi, dan harus print laporan.',
  },
  boardingHouse: {
    templateType: 'anak-kos' as const,
    period: 'monthly' as const,
    description: 'Anak kos, pengeluaran bulanan: bayar kos, laundry, galon, token listrik, pulsa, kadang beli mie instan.',
  },
  officeIntern: {
    templateType: 'kuliah-kerja' as const,
    period: 'monthly' as const,
    description: 'Lagi magang di kantor, tiap hari naik KRL, makan siang di sekitar kantor, kadang ngopi, harus pakai kemeja.',
  },
}

test('A. design assignments -> craft supplies, printing, binding, campus transport only', () => {
  const result = generateRecommendations(fixtures.designStudent)
  const k = keys(result)
  for (const expected of ['karton-maket', 'lem-kertas', 'cutter', 'penggaris-besi', 'print-dokumen', 'jilid', 'transport-kampus']) {
    assert.ok(k.includes(expected), `missing ${expected}`)
  }
  for (const unrelated of ['beras', 'telur', 'deterjen', 'sabun-mandi', 'makan-siang-kerja', 'transport-kantor']) {
    assert.ok(!k.includes(unrelated), `unexpected ${unrelated}`)
  }
  assert.ok(result.contexts.some((context) => context.id === 'kuliah'))
})

test('B. boarding house -> rent, laundry, water, electricity, no campus/office items', () => {
  const k = keys(generateRecommendations(fixtures.boardingHouse))
  for (const expected of ['sewa-kos', 'laundry', 'galon', 'token-listrik', 'paket-data', 'mi-instan', 'makan-harian']) {
    assert.ok(k.includes(expected), `missing ${expected}`)
  }
  for (const unrelated of ['karton-maket', 'transport-kantor', 'krl', 'print-dokumen']) {
    assert.ok(!k.includes(unrelated), `unexpected ${unrelated}`)
  }
})

test('C. office internship -> KRL replaces generic commute, lunch, coffee, work clothes', () => {
  const k = keys(generateRecommendations(fixtures.officeIntern))
  for (const expected of ['krl', 'makan-siang-kerja', 'kopi', 'pakaian-kerja']) {
    assert.ok(k.includes(expected), `missing ${expected}`)
  }
  for (const unrelated of ['transport-kantor', 'transport-kampus', 'karton-maket', 'sewa-kos', 'beras']) {
    assert.ok(!k.includes(unrelated), `unexpected ${unrelated}`)
  }
})

test('three contexts produce clearly different lists', () => {
  const [a, b, c] = Object.values(fixtures).map((fixture) => new Set(keys(generateRecommendations(fixture))))
  const overlap = (x: Set<string>, y: Set<string>) => [...x].filter((key) => y.has(key)).length
  assert.ok(overlap(a, b) <= 1 && overlap(a, c) <= 1 && overlap(b, c) <= 1)
})

test('egg unit and price stay consistent (per butir vs per kg)', () => {
  const perPiece = generateRecommendations({ description: 'mau beli 12 butir telur', period: 'monthly' }).items.find((item) => item.itemKey === 'telur')!
  assert.equal(perPiece.unit, 'butir')
  assert.equal(perPiece.quantity, 12)
  assert.equal(perPiece.unitPrice, ITEMS.telur.unitPrice)
  assert.equal(itemTotal(perPiece), 12 * ITEMS.telur.unitPrice)

  const perKg = generateRecommendations({ description: 'beli telur 2 kg', period: 'monthly' }).items.find((item) => item.itemKey === 'telur')!
  assert.equal(perKg.unit, 'kg')
  assert.equal(perKg.quantity, 2)
  assert.ok(perKg.unitPrice > 20000, 'kg price must be used for kg quantity')
})

test('every item has name, category, positive integer quantity, unit and price; total = qty x price', () => {
  for (const fixture of Object.values(fixtures)) {
    for (const period of ['monthly', 'daily'] as const) {
      for (const item of generateRecommendations({ ...fixture, period }).items) {
        assert.ok(item.name && item.unit && item.category.endsWith(`· ${item.unit}`))
        assert.ok(Number.isInteger(item.quantity) && item.quantity > 0)
        assert.ok(item.unitPrice > 0)
        assert.equal(itemTotal(item), item.quantity * item.unitPrice)
      }
    }
  }
})

test('daily plan skips monthly-only items like rent', () => {
  const k = keys(generateRecommendations({ ...fixtures.boardingHouse, period: 'daily' }))
  assert.ok(!k.includes('sewa-kos') && !k.includes('laundry'))
})

test('empty description falls back to template core items', () => {
  const k = keys(generateRecommendations({ description: '', period: 'monthly', templateType: 'transportasi' }))
  assert.deepEqual(k, ['transport-umum'])
})

test('budget analysis suggests optional cuts first and never removes items', () => {
  const items = generateRecommendations(fixtures.officeIntern).items
  const analysis = analyzeBudget(items, 500000)
  assert.equal(analysis.status, 'over')
  if (analysis.status !== 'over') return
  assert.equal(analysis.over, analysis.total - 500000)
  assert.equal(analysis.suggestions[0].kind, 'remove')
  assert.ok(items.some((item) => item.name === analysis.suggestions[0].name))
  assert.equal(items.length, generateRecommendations(fixtures.officeIntern).items.length)
  assert.equal(analyzeBudget(items, 10_000_000).status, 'within')
})
