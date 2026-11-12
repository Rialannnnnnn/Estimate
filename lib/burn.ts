import type { ProjectBurnSummary } from '@/types/budget'

const DAY = 86400000
const asDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
const dateOnly = (value: string | Date) => typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00`) : new Date(value.getFullYear(), value.getMonth(), value.getDate())

export function hitungBurnProyek(tanggalMulai: string | Date, tanggalSelesai: string | Date, budgetTotal: number, terpakai: number, today = new Date()): ProjectBurnSummary {
  const start = dateOnly(tanggalMulai)
  const end = dateOnly(tanggalSelesai)
  const current = dateOnly(today)
  const hariTotal = Math.max(1, Math.round((asDay(end) - asDay(start)) / DAY) + 1)
  const hariJalan = Math.min(hariTotal, Math.max(1, Math.round((asDay(current) - asDay(start)) / DAY) + 1))
  const sisaHari = Math.max(0, hariTotal - hariJalan)
  const burnHarianAktual = terpakai / hariJalan
  const burnHarianRencana = budgetTotal / hariTotal
  const rencanaKumulatif = budgetTotal * hariJalan / hariTotal
  const proyeksiTotal = terpakai + burnHarianAktual * sisaHari
  const runwayHari = burnHarianAktual > 0 ? Math.max(0, (budgetTotal - terpakai) / burnHarianAktual) : null
  const tanggalHabis = runwayHari == null ? null : new Date(asDay(current) + runwayHari * DAY)
  const rasioBurn = burnHarianRencana > 0 ? burnHarianAktual / burnHarianRencana : null
  const status = rasioBurn == null || rasioBurn < 0.9 ? 'hemat' : rasioBurn <= 1.1 ? 'sesuai rencana' : 'terlalu cepat'
  return { hariTotal, hariJalan, sisaHari, burnHarianAktual, burnHarianRencana, rencanaKumulatif, proyeksiTotal, runwayHari, tanggalHabis, rasioBurn, status, costPerformance: terpakai > 0 ? rencanaKumulatif / terpakai : null, kelebihan: Math.max(0, proyeksiTotal - budgetTotal) }
}
