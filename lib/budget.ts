import type { BudgetPeriod, BurnStatus, ExpenseCategory, FinancialProfile, PeriodSummary, Transaction } from '@/types/budget'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const dateAt = (year: number, month: number, day: number) => new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()))
const dayDiff = (a: Date, b: Date) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000)

export function getPeriodeAnggaran(tanggalGajian: number, today = new Date()): BudgetPeriod {
  const currentPayday = dateAt(today.getFullYear(), today.getMonth(), tanggalGajian)
  const mulai = today >= currentPayday ? currentPayday : dateAt(today.getFullYear(), today.getMonth() - 1, tanggalGajian)
  const nextPayday = dateAt(mulai.getFullYear(), mulai.getMonth() + 1, tanggalGajian)
  const selesai = new Date(nextPayday.getFullYear(), nextPayday.getMonth(), nextPayday.getDate() - 1)
  const hariTotal = dayDiff(mulai, selesai) + 1
  const hariJalan = clamp(dayDiff(mulai, today) + 1, 0, hariTotal)
  return { mulai, selesai, hariTotal, hariJalan, sisaHari: hariTotal - hariJalan }
}

export function normalisasiFrekuensi(plafon: number | null | undefined, frekuensi: string, hariTotal: number): number {
  if (plafon == null || !Number.isFinite(Number(plafon))) return 0
  const amount = Number(plafon)
  switch (frekuensi) {
    case 'harian': return amount * hariTotal
    case 'mingguan': return amount * hariTotal / 7
    case 'bulanan': return amount
    case 'tahunan': return amount / 12
    default: return amount
  }
}

export function hitungRingkasanPeriode(profile: Pick<FinancialProfile, 'pendapatan_bulanan' | 'target_tabungan_bulanan'>, categories: ExpenseCategory[], transactions: Transaction[], period: BudgetPeriod): PeriodSummary {
  const inRange = transactions.filter(t => new Date(`${t.tanggal}T00:00:00`) >= period.mulai && new Date(`${t.tanggal}T00:00:00`) <= period.selesai)
  const incomeFromTransactions = inRange.filter(t => t.tipe === 'masuk').reduce((s, t) => s + Number(t.jumlah), 0)
  const pemasukan = incomeFromTransactions || Number(profile.pendapatan_bulanan || 0)
  const active = categories.filter(c => !c.arsip)
  const biayaWajib = active.filter(c => c.tipe === 'wajib').reduce((s, c) => s + normalisasiFrekuensi(c.plafon, c.frekuensi, period.hariTotal), 0)
  const plafonVariabel = pemasukan - Number(profile.target_tabungan_bulanan || 0) - biayaWajib
  const variableIds = new Set(active.filter(c => c.tipe === 'variabel' && c.hitung_burn).map(c => c.id))
  const aktualVariabel = inRange.filter(t => t.tipe === 'keluar' && t.kategori_id && variableIds.has(t.kategori_id)).reduce((s, t) => s + Number(t.jumlah), 0)
  const burnHarian = aktualVariabel / Math.max(period.hariJalan, 1)
  const burnBulanan = burnHarian * 30
  const burnAmanHarian = (plafonVariabel - aktualVariabel) / Math.max(period.sisaHari, 1)
  const rasioBurn = plafonVariabel > 0 ? burnBulanan / plafonVariabel : null
  const status: BurnStatus = rasioBurn == null ? 'netral' : rasioBurn < 0.8 ? 'hijau' : rasioBurn <= 1 ? 'kuning' : 'merah'
  const totalPengeluaran = inRange.filter(t => t.tipe === 'keluar').reduce((s, t) => s + Number(t.jumlah), 0)
  return { pemasukan, targetTabungan: Number(profile.target_tabungan_bulanan || 0), biayaWajib, plafonVariabel, aktualVariabel, burnHarian, burnBulanan, burnAmanHarian, rasioBurn, status, proyeksiTotal: aktualVariabel + burnHarian * period.sisaHari, savingRateAktual: pemasukan > 0 ? (pemasukan - totalPengeluaran) / pemasukan * 100 : null, sisaHari: period.sisaHari, peringatan: plafonVariabel <= 0 ? 'Target tabungan + biaya wajib melebihi pemasukan periode ini' : null }
}

export const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount)

export function getProgressPercentage(currentTotal: number, budgetLimit: number) {
  return budgetLimit > 0 ? Math.max(0, (currentTotal / budgetLimit) * 100) : currentTotal > 0 ? 100 : 0
}

export function getBudgetStatus(currentTotal: number, budgetLimit: number): 'safe' | 'warning' | 'danger' {
  const percentage = getProgressPercentage(currentTotal, budgetLimit)
  return percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'safe'
}

export function parseCurrencyInput(value: string) {
  const parsed = Number(value.replace(/[^0-9,-]/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}
