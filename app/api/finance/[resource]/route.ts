import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const categorySchema = z.object({
  nama: z.string().trim().min(1).max(80),
  ikon: z.string().min(1).max(40),
  warna_hex: z.string().regex(/^#[\da-fA-F]{6}$/),
  tipe: z.enum(['wajib', 'variabel', 'tabungan']),
  plafon: z.number().finite().nonnegative().nullable(),
  frekuensi: z.enum(['sekali', 'harian', 'mingguan', 'bulanan', 'tahunan']),
  hitung_burn: z.boolean(),
  urutan: z.number().int().nonnegative(),
  arsip: z.boolean().default(false),
})

const profileSchema = z.object({
  pendapatan_bulanan: z.number().finite().nonnegative(),
  tanggal_gajian: z.number().int().min(1).max(31),
  target_tabungan_bulanan: z.number().finite().nonnegative(),
  mindset_type: z.string().max(80).nullable(),
  mindset_jawaban: z.record(z.string(), z.unknown()).nullable(),
  alokasi_default: z.object({ wajib: z.number(), variabel: z.number(), tabungan: z.number() }).nullable(),
})

const transactionSchema = z.object({
  jumlah: z.number().finite().positive(),
  tipe: z.enum(['masuk', 'keluar']),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kategori_id: z.string().uuid().nullable(),
  project_id: z.string().uuid().nullable(),
  catatan: z.string().max(500).nullable(),
})

const projectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  template_type: z.string().min(1).max(40).default('custom'),
  budget: z.number().finite().nonnegative(),
  spent: z.number().finite().nonnegative().default(0),
  budget_total: z.number().finite().nonnegative(),
  tanggal_mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tanggal_selesai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['rencana', 'aktif', 'selesai']).default('aktif'),
})

const schemas = {
  categories: categorySchema,
  profiles: profileSchema,
  transactions: transactionSchema,
  projects: projectSchema,
} as const

const tables = {
  categories: 'expense_categories',
  profiles: 'financial_profiles',
  transactions: 'transactions',
  projects: 'projects',
} as const

type Resource = keyof typeof schemas

async function getContext(resourceName: string) {
  if (!(resourceName in schemas)) return { response: Response.json({ error: 'Resource tidak ditemukan.' }, { status: 404 }) }
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return { response: Response.json({ error: 'Sesi tidak valid. Silakan masuk kembali.' }, { status: 401 }) }
  return { client, user, resource: resourceName as Resource, table: tables[resourceName as Resource] }
}

async function parseValues(resource: Resource, value: unknown, partial = false) {
  const schema = schemas[resource]
  return partial ? schema.partial().safeParse(value) : schema.safeParse(value)
}

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource: resourceName } = await params
  const context = await getContext(resourceName)
  if ('response' in context) return context.response
  const url = new URL(request.url)
  let query = context.client.from(context.table).select('*').eq('user_id', context.user.id)
  const id = url.searchParams.get('id')
  if (id) query = query.eq('id', id)
  if (context.resource === 'categories') query = query.order('urutan')
  else if (context.resource === 'transactions') query = query.order('tanggal', { ascending: false })
  else if (context.resource === 'projects') query = query.order('created_at', { ascending: false })
  const { data, error } = await query
  if (error) return Response.json({ error: 'Data gagal dimuat.' }, { status: 400 })
  return Response.json({ data })
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource: resourceName } = await params
  const context = await getContext(resourceName)
  if ('response' in context) return context.response
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Format permintaan tidak valid.' }, { status: 400 }) }
  const parsed = await parseValues(context.resource, body)
  if (!parsed.success) return Response.json({ error: 'Periksa kembali data yang dikirim.' }, { status: 400 })
  const values = { ...parsed.data, user_id: context.user.id, ...(context.resource === 'profiles' ? { updated_at: new Date().toISOString() } : {}) } as never
  const result = context.resource === 'profiles'
    ? await context.client.from(context.table).upsert(values, { onConflict: 'user_id' }).select().single()
    : context.resource === 'categories'
      ? await context.client.from(context.table).upsert(values, { onConflict: 'user_id,nama' }).select().single()
      : await context.client.from(context.table).insert(values).select().single()
  if (result.error) return Response.json({ error: 'Data gagal disimpan.' }, { status: 400 })
  return Response.json({ data: result.data }, { status: 201 })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource: resourceName } = await params
  const context = await getContext(resourceName)
  if ('response' in context) return context.response
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'Format permintaan tidak valid.' }, { status: 400 }) }
  const payload = z.object({ id: z.string().uuid(), values: z.unknown() }).safeParse(body)
  if (!payload.success) return Response.json({ error: 'ID data tidak valid.' }, { status: 400 })
  const values = await parseValues(context.resource, payload.data.values, true)
  if (!values.success) return Response.json({ error: 'Periksa kembali data yang dikirim.' }, { status: 400 })
  const key = context.resource === 'profiles' ? 'user_id' : 'id'
  const value = context.resource === 'profiles' ? context.user.id : payload.data.id
  const { data, error } = await context.client.from(context.table).update(values.data).eq(key, value).eq('user_id', context.user.id).select().maybeSingle()
  if (error) return Response.json({ error: 'Data gagal diperbarui.' }, { status: 400 })
  if (!data) return Response.json({ error: 'Data tidak ditemukan.' }, { status: 404 })
  return Response.json({ data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource: resourceName } = await params
  const context = await getContext(resourceName)
  if ('response' in context) return context.response
  const payload = z.object({ id: z.string().uuid() }).safeParse(await request.json().catch(() => null))
  if (!payload.success) return Response.json({ error: 'ID data tidak valid.' }, { status: 400 })
  const key = context.resource === 'profiles' ? 'user_id' : 'id'
  const value = context.resource === 'profiles' ? context.user.id : payload.data.id
  const { error } = await context.client.from(context.table).delete().eq(key, value).eq('user_id', context.user.id)
  if (error) return Response.json({ error: 'Data gagal dihapus.' }, { status: 400 })
  return Response.json({ success: true })
}
