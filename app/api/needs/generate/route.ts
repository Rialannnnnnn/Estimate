import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRecommendationCatalog, ITEMS } from '@/lib/recommendations'

const MODEL = 'openai/gpt-5.4-mini'

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
        },
        required: ['action', 'itemKey', 'targetItemId', 'name', 'category', 'unit', 'quantity', 'priority'],
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
      }]
    })

    const safeConversation = conversation.slice(-6).flatMap((entry) => {
      if (!isRecord(entry)) return []
      if ((entry.role !== 'user' && entry.role !== 'assistant') || typeof entry.content !== 'string') return []
      return [{ role: entry.role, content: entry.content.slice(0, 1200) }]
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
      'Kamu adalah asisten perencana kebutuhan dan anggaran EstiMate. Pahami bahasa Indonesia sehari-hari, singkatan, typo ringan, konteks dan instruksi lanjutan seperti ChatGPT.',
      'Tugasmu adalah mengubah instruksi terbaru menjadi perubahan kecil pada daftar kebutuhan, bukan mengeluarkan ulang seluruh daftar.',
      'ATURAN PALING PENTING: daftar yang sudah ada harus tetap dipertahankan. Jangan menghapus, mengganti, menghilangkan, atau mengabaikan item yang tidak disebut pengguna.',
      'Gunakan action add untuk barang baru. Jika barang dan satuannya sudah ada, action add berarti menambahkan kuantitas ke item yang sama (bukan menggandakan baris). Gunakan update hanya ketika pengguna meminta mengganti jumlah atau satuan/nilai item yang sudah ada.',
      'Gunakan action remove hanya jika pengguna dengan jelas meminta barang tertentu dihapus, dibuang, atau tidak diperlukan lagi. Jangan pernah menyimpulkan penghapusan hanya karena barang tidak disebut pada instruksi terbaru.',
      'Jika pengguna meminta menghapus seluruh daftar dan membuat ulang, gunakan remove satu per satu hanya ketika instruksi benar-benar menyebut reset/kosongkan/hapus semua. Setelah itu tambahkan daftar baru yang diminta.',
      'Untuk daftar awal yang masih kosong, buat daftar relevan yang cukup lengkap berdasarkan konteks dan template. Jangan menambah barang yang tidak masuk akal atau menghabiskan seluruh budget.',
      'Prioritaskan katalog yang diberikan. itemKey harus salah satu key katalog atau "custom". Jangan menciptakan itemKey sendiri.',
      'Untuk item katalog, isi name/category/unit sesuai katalog. Gunakan variant/satuan yang benar saat tersedia (misalnya telur per butir atau per kg). Jika satuan tidak jelas dan memengaruhi harga, minta klarifikasi.',
      'Untuk barang custom di luar katalog, gunakan itemKey "custom", nama/category/unit yang masuk akal, dan jangan mengarang harga.',
      'Kuantitas harus angka positif. Jangan mengubah budget pengguna dan jangan mengarang harga, harga pasar, atau harga aktual. Harga akan ditentukan aplikasi dari katalog atau riwayat pembelian pribadi.',
      'Harga pribadi dan Harga Asli tidak dikirim ke model. Jangan menghitung atau menebak nominal harga.',
      'Perubahan harus mengarah ke targetItemId yang benar dari daftar saat ini untuk update/remove. Jangan menebak ID atau mengubah item lain.',
      'Jika instruksi ambigu, tanyakan satu pertanyaan singkat di clarifyingQuestion dan jangan membuat perubahan yang berisiko.',
      'Balas assistantMessage dengan bahasa Indonesia yang singkat, ramah, dan menyebut perubahan yang dilakukan.',
    ].join('\n')

    const prompt = [
      'Periode rencana: ' + (period === 'daily' ? 'harian' : 'bulanan'),
      'Template: ' + (templateType ?? 'tidak dipilih'),
      'Batas budget (panduan, tidak wajib dihabiskan): ' + (budgetLimit ? `Rp ${budgetLimit.toLocaleString('id-ID')}` : 'belum ditentukan'),
      'Daftar yang sedang ada (sumber kebenaran, jangan hilangkan item yang tidak disebut):',
      JSON.stringify(normalizedItems),
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
        max_tokens: 1800,
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
      const category = typeof value.category === 'string' ? value.category.trim().slice(0, 80) : ''
      const unit = typeof value.unit === 'string' ? value.unit.trim().slice(0, 40) : ''
      const quantity = Number(value.quantity)
      const priority = value.priority === 'optional' ? 'optional' : value.priority === 'essential' ? 'essential' : null

      if (!['add', 'update', 'remove'].includes(String(action))
        || !Number.isInteger(quantity) || quantity < 1 || quantity > 10000
        || !priority) return []

      if (action === 'remove') {
        if (!canRemove || !targetItemId || !existingIds.has(targetItemId)) return []
      } else if (action === 'update') {
        if (!targetItemId || !existingIds.has(targetItemId) || !itemKey || (!catalogKeys.has(itemKey) && itemKey !== 'custom')) return []
      } else if (itemKey !== 'custom' && !catalogKeys.has(itemKey)) {
        return []
      }

      if (!name || !category || !unit) return []
      return [{ action, itemKey, targetItemId, name, category, unit, quantity, priority }]
    })

    if (!changes.length && !parsed.clarifyingQuestion) {
      return NextResponse.json({
        error: 'Aku belum menemukan item yang cukup jelas dari instruksi itu. Coba sebut nama barang dan jumlahnya.',
      }, { status: 422 })
    }

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
