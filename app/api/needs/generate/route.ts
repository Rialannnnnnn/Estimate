import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecommendationCatalog, ITEMS } from '@/lib/recommendations'

const MODEL = 'openai/gpt-5.5'

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    assistantMessage: { type: 'string' },
    clarifyingQuestion: { type: ['string', 'null'] },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { type: 'string', enum: ['add', 'update', 'remove'] },
          itemKey: { type: 'string' },
          targetItemId: { type: ['string', 'null'] },
          name: { type: 'string' },
          category: { type: 'string' },
          unit: { type: 'string' },
          quantity: { type: 'integer', minimum: 1, maximum: 10000 },
          priority: { type: 'string', enum: ['essential', 'optional'] },
          userProvidedUnitPrice: { type: ['number', 'null'], minimum: 0, maximum: 1000000000 },
          dailyFrequency: { type: ['integer', 'null'], minimum: 1, maximum: 24 },
          periodDays: { type: ['integer', 'null'], minimum: 1, maximum: 366 },
        },
        required: ['action', 'itemKey', 'targetItemId', 'name', 'category', 'unit', 'quantity', 'priority', 'userProvidedUnitPrice', 'dailyFrequency', 'periodDays'],
      },
    },
  },
  required: ['assistantMessage', 'clarifyingQuestion', 'changes'],
} as const

type CurrentItem = {
  id: string
  name: string
  category: string
  quantity: number
  isPurchased: boolean
  itemKey?: string
  dailyFrequency?: number
  periodDays?: number
}

const ALLOWED_CATEGORIES = [
  'Makanan & Minuman', 'Bahan Makanan', 'Transportasi', 'Tempat Tinggal',
  'Tagihan', 'Kuliah & Tugas', 'Perlengkapan Proyek', 'Alat & Bahan',
  'Rumah Tangga', 'Perawatan', 'Kesehatan', 'Hiburan', 'Tabungan', 'Lainnya',
  'Tugas kuliah', 'Tugas & dokumen', 'Makan', 'Kebutuhan kerja',
  'Tempat tinggal', 'Rumah tangga', 'Dapur', 'Bahan makanan',
  'Keinginan', 'Liburan', 'Cadangan',
] as const

const ALLOWED_UNITS = [
  'pcs', 'buah', 'unit', 'porsi', 'butir', 'kg', 'gram', 'liter', 'ml',
  'botol', 'lembar', 'batang', 'meter', 'tube', 'pack', 'paket', 'roll',
  'set', 'kali', 'hari', 'bulan', 'perjalanan', 'galon', 'tabung',
  'bungkus', 'pasang', 'box', 'rim', 'jam', 'gelas', 'token', 'pouch',
  'karung 5 kg', 'ikat', 'bungkus isi 10', 'papan', 'strip', 'orang',
  'malam', 'tiket', 'setoran', 'alokasi', 'lbr', 'halaman', 'hal',
  'eksemplar', 'rangkap', 'cup', 'trip', 'l', 'kilo', 'bks', 'karung',
  'btr', 'potong',
] as const


function canonicalizeCategory(value: string, itemName: string) {
  const normalize = (text: string) => text.toLocaleLowerCase('id').replace(/[^a-z0-9]+/g, ' ').trim()
  const direct = ALLOWED_CATEGORIES.find((entry) => normalize(entry) === normalize(value))
  if (direct) return direct

  const text = normalize(`${value} ${itemName}`)
  if (/makan|makanan|minum|porsi|telur|beras|sayur|buah|daging|ayam|ikan|kopi/.test(text)) return 'Makanan & Minuman'
  if (/proyek|project|kursi|kayu|lem|sekrup|paku|amplas|finishing|bahan/.test(text)) return 'Perlengkapan Proyek'
  if (/kuliah|tugas|maket|print|kampus|buku/.test(text)) return 'Kuliah & Tugas'
  if (/transport|ojek|bensin|parkir|perjalanan/.test(text)) return 'Transportasi'
  if (/kos|kost|rumah|laundry|sabun|deterjen/.test(text)) return 'Rumah Tangga'
  if (/tagihan|listrik|wifi|internet/.test(text)) return 'Tagihan'
  return 'Lainnya'
}

function canonicalizeUnit(value: string, itemName: string) {
  const normalize = (text: string) => text.toLocaleLowerCase('id').replace(/[^a-z0-9]+/g, ' ').trim()
  const direct = ALLOWED_UNITS.find((entry) => normalize(entry) === normalize(value))
  if (direct) return direct

  const unit = normalize(value)
  if (/kilogram|kilo gram|kilo/.test(unit)) return 'kg'
  if (/gram|gr\b/.test(unit)) return 'gram'
  if (/liter|litre|ltr/.test(unit)) return 'liter'
  if (/portion|serving|porsi/.test(unit)) return 'porsi'
  if (/piece|pieces|buah|unit|item/.test(unit)) return 'pcs'
  if (/batang|stick/.test(unit)) return 'batang'
  if (/lembar|sheet/.test(unit)) return 'lembar'
  if (/bottle|botol/.test(unit)) return 'botol'
  if (/bag|pack|paket/.test(unit)) return 'pack'
  if (/day|hari/.test(unit)) return 'hari'
  if (/month|bulan/.test(unit)) return 'bulan'
  if (/cup|glass|gelas/.test(unit)) return 'gelas'
  if (/bundle|set|paket/.test(unit)) return 'set'
  if (/^$/.test(unit)) return /makan|nasi|sarapan|makan siang|makan malam/i.test(itemName) ? 'porsi' : 'pcs'
  return 'pcs'
}

function extractExplicitPrices(description: string) {
  const prices = new Set<number>()
  const text = description.toLocaleLowerCase('id')

  const normalizeAmount = (value: string) => Number(value.replace(/[.,]/g, ''))

  for (const match of text.matchAll(/(?:rp\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(ribu|rb|juta|jt)\b/g)) {
    const value = normalizeAmount(match[1])
    if (!Number.isFinite(value) || value <= 0) continue
    const multiplier = match[2] === 'juta' || match[2] === 'jt' ? 1_000_000 : 1_000
    prices.add(Math.round(value * multiplier))
  }

  for (const match of text.matchAll(/\brp\s*(\d{1,3}(?:[.,]\d{3})+|\d+)\b/g)) {
    const value = normalizeAmount(match[1])
    if (Number.isFinite(value) && value > 0) prices.add(Math.round(value))
  }

  for (const match of text.matchAll(/\b(?:harga|seharga|per porsi|per unit|per buah)\s*(?:rp\s*)?(\d{1,3}(?:[.,]\d{3})+|\d+)\b/g)) {
    const value = normalizeAmount(match[1])
    if (Number.isFinite(value) && value > 0) prices.add(Math.round(value))
  }

  return [...prices]
}
function containsDailyFrequencyIntent(description: string) {
  return /\b(per hari|sehari|tiap hari|setiap hari|harian|sehari-hari|perharinya)\b/i.test(description)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasNegatedRemoveIntent(description: string) {
  return /\b(jangan|tanpa|tidak|nggak|gak|ga)\b.{0,24}\b(hapus|menghapus|hilangkan|buang)\b/i.test(description)
}

function mayRemoveItems(description: string) {
  if (hasNegatedRemoveIntent(description)) return false
  return /\b(hapus|menghapus|hilangkan|buang|tidak perlu lagi|nggak perlu lagi|ga perlu lagi|gak perlu lagi|sudah tidak butuh)\b/i.test(description)
}

function isExplicitBulkReset(description: string) {
  return !hasNegatedRemoveIntent(description)
    && /(hapus semua|kosongkan daftar|reset daftar|mulai ulang daftar|mulai dari awal|ganti seluruh daftar|buat ulang seluruh daftar)/i.test(description)
}

function mayUpdateItems(description: string) {
  if (/\b(jangan|tanpa|tidak|nggak|gak|ga)\b.{0,24}\b(ubah|ganti|kurangi|naikkan|turunkan|perbarui|revisi|sesuaikan)\b/i.test(description)) return false
  return /\b(ubah|ganti|jadikan|kurangi|naikkan|turunkan|perbarui|revisi|sesuaikan|cukup|menjadi)\b|\bjadi\s+\d+/i.test(description)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Silakan masuk terlebih dahulu untuk memakai AI EstiMate.' }, { status: 401 })
    }

    const body: unknown = await request.json()
    if (!isRecord(body)) {
      return NextResponse.json({ error: 'Format permintaan tidak valid.' }, { status: 400 })
    }

    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const period = body.period === 'daily' ? 'daily' : body.period === 'monthly' ? 'monthly' : null
    const templateType = typeof body.templateType === 'string' ? body.templateType : null
    const currentItems = Array.isArray(body.currentItems) ? body.currentItems : []
    const budgetLimit = Number.isFinite(Number(body.budgetLimit)) && Number(body.budgetLimit) > 0
      ? Math.min(1_000_000_000, Math.floor(Number(body.budgetLimit)))
      : null
    const conversation = Array.isArray(body.conversation) ? body.conversation : []

    if (!description || description.length > 1500 || !period || currentItems.length > 100) {
      return NextResponse.json({ error: 'Instruksi harus 1–1.500 karakter dan daftar maksimal 100 item.' }, { status: 400 })
    }

    const normalizedItems: CurrentItem[] = currentItems.flatMap((value) => {
      if (!isRecord(value)) return []
      const id = typeof value.id === 'string' ? value.id.slice(0, 120) : ''
      const name = typeof value.name === 'string' ? value.name.slice(0, 120) : ''
      const category = typeof value.category === 'string' ? value.category.slice(0, 100) : ''
      if (!id || !name) return []
      return [{
        id, name, category,
        quantity: Math.max(1, Math.min(10000, Math.floor(Number(value.quantity) || 1))),
        isPurchased: value.isPurchased === true,
        ...(typeof value.itemKey === 'string' ? { itemKey: value.itemKey } : {}),
        ...(Number.isInteger(value.dailyFrequency) ? { dailyFrequency: Number(value.dailyFrequency) } : {}),
        ...(Number.isInteger(value.periodDays) ? { periodDays: Number(value.periodDays) } : {}),
      }]
    })

    const safeConversation = conversation.slice(-16).flatMap((entry) => {
      if (!isRecord(entry)) return []
      if ((entry.role !== 'user' && entry.role !== 'assistant') || typeof entry.content !== 'string') return []
      return [{ role: entry.role, content: entry.content.slice(0, 1600) }]
    })

    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    if (!apiKey) {
      return NextResponse.json({
        error: 'Koneksi AI Gateway belum tersedia. Pastikan Vercel OIDC aktif atau AI_GATEWAY_API_KEY sudah diatur.',
      }, { status: 503 })
    }

    const catalog = getRecommendationCatalog()
    const catalogKeys = new Set(Object.keys(ITEMS))
    const system = [
      'Kamu adalah otak perencana kebutuhan dan anggaran EstiMate yang sangat cermat. Pahami Bahasa Indonesia percakapan, typo ringan, angka tidak baku, konteks, cerita panjang, dan instruksi lanjutan.',
      'Baca SELURUH pesan dari awal sampai akhir, termasuk beberapa baris, daftar, cerita, pertanyaan, typo, bahasa santai dan beberapa topik sekaligus. Jangan hanya mengambil kata benda terakhir atau item yang paling mudah dikenali. Pecah setiap kebutuhan yang berbeda menjadi operasi item yang tepat.',
      'Contoh pesan multi-inten: "aku makan 3 kali sehari 25 ribu, perlu project kursi, dan telur 2 kg" harus menghasilkan item makan 90 porsi dengan harga 25000, beberapa material kursi yang masuk akal, serta telur 2 kg. Jangan memilih satu topik lalu mengabaikan topik lainnya.',
      'Jika pesan berisi pertanyaan umum atau obrolan tanpa perubahan daftar, jawab dengan assistantMessage seperti asisten percakapan biasa dan kembalikan changes kosong. Jangan memaksakan item baru untuk setiap pesan.',
      'DAFTAR LAMA ADALAH SUMBER KEBENARAN. Jangan pernah mengganti daftar penuh. Keluarkan hanya operasi add, update, atau remove yang diperlukan.',
      'Jika pengguna hanya menambah konteks atau barang baru, gunakan add hanya untuk item baru dan pertahankan semua item yang tidak disebut. Jangan mengubah atau menghapus item lama secara implisit.',
      'Bandingkan setiap ide dengan daftar yang sedang ada. Jika barang yang sama, jumlah dan konteksnya sudah ada, jangan tambahkan duplikat dan jangan menambah jumlah hanya karena pengguna mengulangi cerita. Tambah kuantitas hanya bila pengguna jelas berkata tambah lagi/ditambah sekian. Jika pengguna menyebut nilai baru sebagai pengganti, gunakan update ke jumlah akhir yang dimaksud.',
      'Gunakan update hanya bila pengguna jelas meminta mengubah jumlah, harga, kategori, atau satuan item yang sudah ada; targetItemId wajib tepat.',
      'Gunakan remove hanya jika pengguna jelas meminta menghapus item tertentu atau mengosongkan daftar. Jangan tafsirkan kalimat negatif seperti "jangan dihapus" sebagai izin hapus.',
      'Untuk kebutuhan rutin, hitung jumlah unit secara eksplisit. Contoh: makan 3 kali sehari selama 30 hari = 90 porsi; bila harga yang disebut pengguna Rp25.000/porsi, maka harga satuan adalah 25000 dan jumlah 90. Isi dailyFrequency=3, periodDays=30, quantity=90.',
      'Jika kebutuhan makan disebut harga per porsi/per kali, gunakan item custom bernama Makan, kategori Makanan & Minuman, satuan porsi. Jangan memilih item katalog Makan Harian yang satuannya hari, karena harga per porsi harus dikalikan jumlah porsi.',
      'Jika rencana bulanan dan pengguna menyebut setiap hari/sehari tanpa durasi lain, gunakan 30 hari. Untuk rencana harian gunakan 1 hari. Jangan menambahkan frekuensi jika tidak ada petunjuk pengulangan.',
      'userProvidedUnitPrice hanya boleh diisi jika nominal harga per unit benar-benar disebutkan di pesan pengguna. Jangan mengarang harga untuk bahan proyek. Jika tidak ada harga eksplisit, isi null; aplikasi memakai katalog untuk item katalog dan 0 untuk item custom.',
      'Jangan salah mengalikan: dailyFrequency × periodDays = quantity; harga satuan × quantity = total. Jangan memasukkan total anggaran sebagai harga satuan.',
      'Untuk proyek/DIY/tugas fisik, pecah menjadi material dan perlengkapan terpisah. Misalnya proyek kursi dapat mencakup kayu, lem kayu, sekrup/paku, amplas dan finishing bila relevan. Jangan memberi harga yang tidak disebutkan. Bila ukuran/dimensi tidak diketahui, gunakan jumlah awal konservatif dan jelaskan bahwa kuantitas perlu disesuaikan ukuran/desain.',
      'Gunakan kategori dari pilihan berikut: ' + ALLOWED_CATEGORIES.join(', ') + '. Gunakan satuan dari pilihan berikut: ' + ALLOWED_UNITS.join(', ') + '. Pilih kategori dan satuan yang paling tepat; jangan meminta pengguna mengetik kategori/satuan.',
      'Prioritaskan itemKey katalog jika benar-benar cocok; selain itu gunakan itemKey "custom". Jangan memaksakan item ke kategori katalog yang tidak sesuai.',
      'Untuk item katalog, nama, kategori dan satuan harus sesuai katalog. Untuk item custom, kategori dan satuan harus dipilih dari pilihan yang tersedia.',
      'Jangan mengubah batas budget pengguna. Jangan mengarang harga pasar, harga aktual, atau riwayat pembelian. Harga pribadi dan Harga Asli tidak dikirim ke model.',
      'Jika ukuran, periode, satuan, atau detail penting tidak cukup jelas untuk perhitungan yang bisa dipercaya, ajukan satu pertanyaan klarifikasi. Namun tetap buat item lain yang sudah jelas.',
      'Balas assistantMessage dengan Bahasa Indonesia yang ramah, ringkas, dan jelaskan perhitungan, asumsi, serta hal yang perlu dikonfirmasi.',
    ].join('\n')

    const prompt = [
      'Periode rencana: ' + (period === 'daily' ? 'harian' : 'bulanan'),
      'Template: ' + (templateType ?? 'tidak dipilih'),
      'Batas budget (panduan, tidak wajib dihabiskan): ' + (budgetLimit ? `Rp ${budgetLimit.toLocaleString('id-ID')}` : 'belum ditentukan'),
      'Daftar yang sedang ada (sumber kebenaran, jangan hilangkan item yang tidak disebut; frekuensi sebelumnya juga harus dipertahankan):',
      JSON.stringify(normalizedItems),
      'Kategori yang diperbolehkan: ' + JSON.stringify(ALLOWED_CATEGORIES),
      'Satuan yang diperbolehkan: ' + JSON.stringify(ALLOWED_UNITS),
      'Katalog item resmi (hanya gunakan key di sini):',
      JSON.stringify(catalog),
      'Instruksi terbaru pengguna:',
      description,
      'Pahami instruksi terbaru sebagai perubahan terhadap daftar yang sedang ada. Keluarkan hanya perubahan yang diperlukan.',
    ].join('\n\n')

    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.1,
        reasoning_effort: 'high',
        max_tokens: 3600,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'estimate_needs_changes',
            strict: true,
            schema: responseSchema,
          },
        },
        messages: [
          { role: 'system', content: system },
          ...safeConversation,
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    })

    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 1000)
      console.error('AI Gateway request failed:', response.status, errorText)
      return NextResponse.json({ error: 'AI EstiMate sedang tidak bisa digunakan. Daftar kamu belum diubah, coba lagi sebentar.' }, { status: 502 })
    }

    const payload: unknown = await response.json()
    if (!isRecord(payload) || !Array.isArray(payload.choices) || !isRecord(payload.choices[0])) {
      return NextResponse.json({ error: 'Respons AI tidak dapat dibaca. Daftar kamu tetap aman.' }, { status: 502 })
    }

    const firstChoice = payload.choices[0]
    const message = firstChoice.message
    if (!isRecord(message) || typeof message.content !== 'string') {
      return NextResponse.json({ error: 'AI belum memberikan perubahan yang valid. Daftar kamu tetap aman.' }, { status: 502 })
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(message.content)
    } catch {
      return NextResponse.json({ error: 'Format hasil AI tidak valid. Daftar kamu tetap aman.' }, { status: 502 })
    }

    if (!isRecord(parsed) || !Array.isArray(parsed.changes)
      || typeof parsed.assistantMessage !== 'string'
      || !(typeof parsed.clarifyingQuestion === 'string' || parsed.clarifyingQuestion === null)) {
      return NextResponse.json({ error: 'Struktur hasil AI tidak sesuai. Daftar kamu tetap aman.' }, { status: 502 })
    }

    const existingIds = new Set(normalizedItems.map((item) => item.id))
    const canBulkReset = isExplicitBulkReset(description)
    const canRemove = mayRemoveItems(description) || canBulkReset
    const changes = parsed.changes.slice(0, 40).flatMap((value) => {
      if (!isRecord(value)) return []
      const action = value.action
      const itemKey = typeof value.itemKey === 'string' ? value.itemKey : ''
      const targetItemId = typeof value.targetItemId === 'string' ? value.targetItemId : null
      const name = typeof value.name === 'string' ? value.name.trim().slice(0, 100) : ''
      const rawCategory = typeof value.category === 'string' ? value.category.trim().slice(0, 80) : ''
      const rawUnit = typeof value.unit === 'string' ? value.unit.trim().slice(0, 40) : ''
      const category = canonicalizeCategory(rawCategory, name)
      const unit = canonicalizeUnit(rawUnit, name)
      const rawQuantity = Number(value.quantity)
      const explicitPrices = extractExplicitPrices(description)
      const modelPrice = value.userProvidedUnitPrice == null ? null : Number(value.userProvidedUnitPrice)
      const userProvidedUnitPrice = modelPrice != null && explicitPrices.includes(Math.round(modelPrice))
        ? Math.round(modelPrice)
        : null
      const dailyFrequency = Number.isInteger(Number(value.dailyFrequency)) && Number(value.dailyFrequency) >= 1
        ? Math.min(24, Number(value.dailyFrequency))
        : null
      const modelPeriodDays = Number.isInteger(Number(value.periodDays)) && Number(value.periodDays) >= 1
        ? Math.min(366, Number(value.periodDays))
        : null
      const periodDays = dailyFrequency && containsDailyFrequencyIntent(description)
        ? (modelPeriodDays ?? (period === 'monthly' ? 30 : 1))
        : null
      const quantity = dailyFrequency && periodDays
        ? Math.min(10000, dailyFrequency * periodDays)
        : rawQuantity
      const priority = value.priority === 'optional' ? 'optional' : value.priority === 'essential' ? 'essential' : null

      if (!['add', 'update', 'remove'].includes(String(action))
        || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000
        || !priority) return []
      if (action === 'remove') {
        if (!canRemove || !targetItemId || !existingIds.has(targetItemId)) return []
      } else if (action === 'update') {
        if (!mayUpdateItems(description) || !targetItemId || !existingIds.has(targetItemId) || !itemKey || (!catalogKeys.has(itemKey) && itemKey !== 'custom')) return []
      } else if (itemKey !== 'custom' && !catalogKeys.has(itemKey)) {
        return []
      }

      if (!name || !category || !unit) return []
      return [{
        action, itemKey, targetItemId, name, category, unit, quantity, priority,
        userProvidedUnitPrice,
        dailyFrequency,
        periodDays,
      }]
    })

    return NextResponse.json({
      assistantMessage: parsed.assistantMessage.slice(0, 600),
      clarifyingQuestion: parsed.clarifyingQuestion?.slice(0, 300) ?? null,
      changes,
      mode: normalizedItems.length ? 'incremental' : 'initial',
      allowBulkReset: canBulkReset,
    })
  } catch (error) {
    console.error('Needs generation failed:', error)
    const isTimeout = error instanceof Error && error.name === 'TimeoutError'
    return NextResponse.json({
      error: isTimeout
        ? 'AI membutuhkan waktu terlalu lama. Daftar kamu tidak berubah, silakan coba lagi.'
        : 'Ada kendala saat memproses instruksi AI. Daftar kamu tidak berubah.',
    }, { status: 500 })
  }
}
