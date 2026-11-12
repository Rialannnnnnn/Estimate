export type CategoryType = 'wajib' | 'variabel' | 'tabungan'
export type Frequency = 'sekali' | 'harian' | 'mingguan' | 'bulanan' | 'tahunan'
export type TransactionType = 'masuk' | 'keluar'
export type BurnStatus = 'netral' | 'hijau' | 'kuning' | 'merah'

export interface FinancialProfile {
  id: string; user_id: string; pendapatan_bulanan: number; tanggal_gajian: number
  target_tabungan_bulanan: number; mindset_type: string | null; mindset_jawaban: Record<string, string> | null
  alokasi_default: { wajib: number; variabel: number; tabungan: number } | null
  created_at: string; updated_at: string
}
export interface ExpenseCategory {
  id: string; user_id: string; nama: string; ikon: string; warna_hex: string; tipe: CategoryType
  plafon: number | null; frekuensi: Frequency; hitung_burn: boolean; urutan: number; arsip: boolean; created_at: string
}
export interface Transaction {
  id: string; user_id: string; kategori_id: string | null; project_id: string | null; tipe: TransactionType
  tanggal: string; jumlah: number; catatan: string | null; created_at: string
}
export interface BudgetPeriod { mulai: Date; selesai: Date; hariTotal: number; hariJalan: number; sisaHari: number }
export interface PeriodSummary {
  pemasukan: number; targetTabungan: number; biayaWajib: number; plafonVariabel: number; aktualVariabel: number
  burnHarian: number; burnBulanan: number; burnAmanHarian: number; rasioBurn: number | null
  status: BurnStatus; proyeksiTotal: number; savingRateAktual: number | null; sisaHari: number; peringatan: string | null
}
export interface ProjectBurnSummary {
  hariTotal: number; hariJalan: number; sisaHari: number; burnHarianAktual: number; burnHarianRencana: number
  rencanaKumulatif: number; proyeksiTotal: number; runwayHari: number | null; tanggalHabis: Date | null
  rasioBurn: number | null; status: 'hemat' | 'sesuai rencana' | 'terlalu cepat'; costPerformance: number | null; kelebihan: number
}
