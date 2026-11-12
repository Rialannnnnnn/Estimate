import assert from 'node:assert/strict'
import test from 'node:test'
import { getPeriodeAnggaran, hitungRingkasanPeriode, normalisasiFrekuensi } from '../lib/budget.ts'
import { hitungBurnProyek } from '../lib/burn.ts'
import { scoreMindset } from '../lib/mindset.ts'

test('payday period summary keeps monthly category limits intact', () => {
  const period = getPeriodeAnggaran(25, new Date(2026, 10, 5))
  assert.equal(period.mulai.toISOString().slice(0, 10), '2026-10-25')
  assert.equal(period.selesai.toISOString().slice(0, 10), '2026-11-24')
  assert.equal(period.hariJalan, 12)
  assert.equal(normalisasiFrekuensi(2_400_000, 'bulanan', period.hariTotal), 2_400_000)

  const summary = hitungRingkasanPeriode(
    { pendapatan_bulanan: 6_000_000, target_tabungan_bulanan: 1_000_000 },
    [
      { id: 'fixed', user_id: 'user', nama: 'Tagihan', ikon: 'Wallet', warna_hex: '#235B45', tipe: 'wajib', plafon: 2_400_000, frekuensi: 'bulanan', hitung_burn: false, urutan: 0, arsip: false, created_at: '' },
      { id: 'variable', user_id: 'user', nama: 'Harian', ikon: 'Wallet', warna_hex: '#D98A42', tipe: 'variabel', plafon: null, frekuensi: 'bulanan', hitung_burn: true, urutan: 1, arsip: false, created_at: '' },
    ],
    [{ id: 'expense', user_id: 'user', kategori_id: 'variable', project_id: null, tipe: 'keluar', tanggal: '2026-10-27', jumlah: 900_000, catatan: null, created_at: '' }],
    period,
  )

  assert.equal(summary.pemasukan, 6_000_000)
  assert.equal(summary.biayaWajib, 2_400_000)
  assert.equal(summary.plafonVariabel, 2_600_000)
  assert.equal(summary.aktualVariabel, 900_000)
  assert.equal(summary.burnHarian, 75_000)
  assert.equal(summary.burnBulanan, 2_250_000)
  assert.equal(summary.burnAmanHarian, 1_700_000 / 19)
  assert.equal(summary.rasioBurn, 2_250_000 / 2_600_000)
  assert.equal(summary.status, 'kuning')
})

test('project burn reports runway and schedule status', () => {
  const summary = hitungBurnProyek('2026-10-01', '2026-10-20', 5_000_000, 1_800_000, new Date(2026, 9, 10))
  assert.equal(summary.hariTotal, 20)
  assert.equal(summary.hariJalan, 10)
  assert.equal(summary.burnHarianAktual, 180_000)
  assert.equal(summary.burnHarianRencana, 250_000)
  assert.equal(summary.proyeksiTotal, 3_600_000)
  assert.equal(summary.runwayHari, 3_200_000 / 180_000)
  assert.equal(summary.status, 'hemat')
  assert.equal(summary.costPerformance, 2_500_000 / 1_800_000)
})

test('mindset scoring returns an adjustable allocation', () => {
  const result = scoreMindset({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 })
  assert.equal(result.score, 14)
  assert.equal(result.type, 'Pembayar Tagihan Dulu')
  assert.deepEqual(result.allocation, { wajib: 60, variabel: 25, tabungan: 15 })
})
