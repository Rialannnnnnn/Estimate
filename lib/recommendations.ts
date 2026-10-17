import type { Material } from '@/lib/types'
import type { TemplateType } from '@/lib/templates'

/**
 * Rule-based shopping recommendations for the "Generate item belanja" flow.
 *
 * Nothing here is AI or market data: items come from a hand-maintained catalog,
 * are selected by Indonesian keywords/synonyms and the chosen template, and use
 * fixed estimated prices that the user is expected to adjust.
 *
 * To extend: add an entry to `ITEMS`, then reference it from a context's `core`
 * list or a keyword `BUNDLES` entry.
 */

export type Period = 'daily' | 'monthly'
export type Priority = 'essential' | 'optional'

type UnitVariant = {
  pattern: RegExp
  unit: string
  unitPrice: number
  monthly: number
  daily: number | null
  unitAliases?: string[]
}

type ItemDef = {
  name: string
  category: string
  unit: string
  /** Estimated price for exactly one `unit`. */
  unitPrice: number
  monthly: number
  /** `null` = not something you plan for in a single day. */
  daily: number | null
  dailyUnitPrice?: number
  priority: Priority
  unitAliases?: string[]
  /** Switch unit and price together when the description names another unit, e.g. "telur 1 kg". */
  variants?: UnitVariant[]
}

type ContextId =
  | 'kuliah'
  | 'kerja'
  | 'kos'
  | 'rumah'
  | 'belanja'
  | 'makan'
  | 'transportasi'
  | 'kesehatan'
  | 'liburan'
  | 'hiburan'
  | 'tagihan'
  | 'tabungan'
  | 'harian'

type ContextDef = {
  label: string
  keywords: string[]
  templates: TemplateType[]
  core: string[]
}

type Bundle = {
  context: ContextId
  keywords: string[]
  items: string[]
  supersedes?: string[]
}

export const ITEMS: Record<string, ItemDef> = {
  // Kuliah & tugas
  'karton-maket': { name: 'Karton / board maket', category: 'Tugas kuliah', unit: 'lembar', unitPrice: 12000, monthly: 4, daily: 2, priority: 'essential', unitAliases: ['lembar', 'lbr'] },
  'lem-kertas': { name: 'Lem kertas / UHU', category: 'Tugas kuliah', unit: 'tube', unitPrice: 10000, monthly: 2, daily: 1, priority: 'essential' },
  cutter: { name: 'Cutter', category: 'Tugas kuliah', unit: 'pcs', unitPrice: 15000, monthly: 1, daily: 1, priority: 'essential' },
  'isi-cutter': { name: 'Isi ulang mata cutter', category: 'Tugas kuliah', unit: 'pack', unitPrice: 8000, monthly: 1, daily: 1, priority: 'optional' },
  'penggaris-besi': { name: 'Penggaris besi 30 cm', category: 'Tugas kuliah', unit: 'pcs', unitPrice: 15000, monthly: 1, daily: 1, priority: 'essential' },
  'cutting-mat': { name: 'Cutting mat A3', category: 'Tugas kuliah', unit: 'pcs', unitPrice: 45000, monthly: 1, daily: 1, priority: 'optional' },
  'kertas-hvs': { name: 'Kertas HVS A4', category: 'Tugas kuliah', unit: 'rim', unitPrice: 55000, monthly: 1, daily: 1, priority: 'essential', unitAliases: ['rim'] },
  'print-dokumen': { name: 'Print dokumen / tugas', category: 'Tugas & dokumen', unit: 'lembar', unitPrice: 1000, monthly: 100, daily: 20, priority: 'essential', unitAliases: ['lembar', 'lbr', 'halaman', 'hal'] },
  'print-warna': { name: 'Print warna', category: 'Tugas & dokumen', unit: 'lembar', unitPrice: 2500, monthly: 20, daily: 5, priority: 'optional', unitAliases: ['lembar', 'lbr', 'halaman'] },
  jilid: { name: 'Penjilidan laporan', category: 'Tugas & dokumen', unit: 'kali', unitPrice: 7000, monthly: 2, daily: 1, priority: 'essential', unitAliases: ['kali', 'buah', 'eksemplar', 'rangkap'] },
  fotokopi: { name: 'Fotokopi materi', category: 'Tugas & dokumen', unit: 'lembar', unitPrice: 300, monthly: 100, daily: 20, priority: 'essential', unitAliases: ['lembar', 'lbr', 'halaman'] },
  'alat-tulis': { name: 'Alat tulis (pulpen, pensil)', category: 'Tugas kuliah', unit: 'paket', unitPrice: 25000, monthly: 1, daily: 1, priority: 'optional' },
  'buku-tulis': { name: 'Buku tulis', category: 'Tugas kuliah', unit: 'pcs', unitPrice: 6000, monthly: 3, daily: 1, priority: 'optional', unitAliases: ['buah', 'pcs'] },
  'biaya-praktikum': { name: 'Modul / biaya praktikum', category: 'Tugas kuliah', unit: 'paket', unitPrice: 50000, monthly: 1, daily: null, priority: 'essential' },
  'transport-kampus': { name: 'Transportasi ke kampus', category: 'Transportasi', unit: 'perjalanan', unitPrice: 10000, monthly: 40, daily: 2, priority: 'essential' },

  // Kerja & magang
  'transport-kantor': { name: 'Transportasi ke kantor', category: 'Transportasi', unit: 'perjalanan', unitPrice: 12000, monthly: 44, daily: 2, priority: 'essential' },
  'makan-siang-kerja': { name: 'Makan siang kerja', category: 'Makan', unit: 'porsi', unitPrice: 25000, monthly: 22, daily: 1, priority: 'essential' },
  kopi: { name: 'Kopi', category: 'Makan', unit: 'gelas', unitPrice: 20000, monthly: 8, daily: 1, priority: 'optional', unitAliases: ['gelas', 'cup'] },
  'pakaian-kerja': { name: 'Kemeja / pakaian kerja', category: 'Kebutuhan kerja', unit: 'pcs', unitPrice: 120000, monthly: 1, daily: null, priority: 'optional' },

  // Transportasi
  'transport-umum': { name: 'Transportasi umum', category: 'Transportasi', unit: 'perjalanan', unitPrice: 8000, monthly: 40, daily: 2, priority: 'essential' },
  krl: { name: 'Tiket KRL / commuter line', category: 'Transportasi', unit: 'perjalanan', unitPrice: 5000, monthly: 44, daily: 2, priority: 'essential' },
  'ojek-stasiun': { name: 'Ojek ke stasiun', category: 'Transportasi', unit: 'perjalanan', unitPrice: 12000, monthly: 22, daily: 1, priority: 'optional' },
  busway: { name: 'Tiket TransJakarta / bus kota', category: 'Transportasi', unit: 'perjalanan', unitPrice: 3500, monthly: 44, daily: 2, priority: 'essential' },
  ojol: { name: 'Ojek online', category: 'Transportasi', unit: 'perjalanan', unitPrice: 15000, monthly: 20, daily: 2, priority: 'essential', unitAliases: ['kali', 'perjalanan', 'trip'] },
  bensin: { name: 'Bensin motor', category: 'Transportasi', unit: 'liter', unitPrice: 10000, monthly: 15, daily: 1, priority: 'essential', unitAliases: ['liter', 'l'] },
  parkir: { name: 'Parkir', category: 'Transportasi', unit: 'kali', unitPrice: 3000, monthly: 22, daily: 1, priority: 'essential' },
  'ganti-oli': { name: 'Ganti oli motor', category: 'Transportasi', unit: 'kali', unitPrice: 60000, monthly: 1, daily: null, priority: 'optional' },

  // Anak kos & tempat tinggal
  'sewa-kos': { name: 'Sewa kos', category: 'Tempat tinggal', unit: 'bulan', unitPrice: 1000000, monthly: 1, daily: null, priority: 'essential' },
  'makan-harian': { name: 'Makan harian', category: 'Makan', unit: 'hari', unitPrice: 35000, monthly: 30, daily: 1, priority: 'essential', unitAliases: ['hari'] },
  galon: { name: 'Air minum galon isi ulang', category: 'Makan', unit: 'galon', unitPrice: 7000, monthly: 4, daily: null, priority: 'essential', unitAliases: ['galon'] },
  laundry: { name: 'Laundry kiloan', category: 'Rumah tangga', unit: 'kg', unitPrice: 8000, monthly: 12, daily: null, priority: 'essential', unitAliases: ['kg', 'kilo'] },
  'token-listrik': { name: 'Token listrik', category: 'Tagihan', unit: 'token', unitPrice: 100000, monthly: 1, daily: null, priority: 'essential' },
  'sabun-mandi': { name: 'Sabun mandi', category: 'Perawatan', unit: 'pcs', unitPrice: 5000, monthly: 2, daily: null, priority: 'essential', unitAliases: ['batang', 'pcs'] },
  sampo: { name: 'Sampo', category: 'Perawatan', unit: 'botol', unitPrice: 25000, monthly: 1, daily: null, priority: 'essential', unitAliases: ['botol'] },
  'pasta-gigi': { name: 'Pasta gigi', category: 'Perawatan', unit: 'tube', unitPrice: 15000, monthly: 1, daily: null, priority: 'essential' },
  'mi-instan': { name: 'Mi instan (stok)', category: 'Makan', unit: 'bungkus', unitPrice: 3500, monthly: 10, daily: null, priority: 'optional', unitAliases: ['bungkus', 'bks', 'pcs'] },

  // Rumah tangga
  deterjen: { name: 'Deterjen bubuk 800 g', category: 'Rumah tangga', unit: 'pack', unitPrice: 25000, monthly: 1, daily: null, priority: 'essential' },
  pewangi: { name: 'Pewangi pakaian', category: 'Rumah tangga', unit: 'pouch', unitPrice: 15000, monthly: 1, daily: null, priority: 'optional' },
  'sabun-cuci-piring': { name: 'Sabun cuci piring', category: 'Rumah tangga', unit: 'pouch', unitPrice: 15000, monthly: 1, daily: null, priority: 'essential' },
  'pembersih-lantai': { name: 'Pembersih lantai', category: 'Rumah tangga', unit: 'pouch', unitPrice: 15000, monthly: 1, daily: null, priority: 'essential' },
  tisu: { name: 'Tisu', category: 'Rumah tangga', unit: 'pack', unitPrice: 12000, monthly: 2, daily: null, priority: 'optional' },
  'kantong-sampah': { name: 'Kantong sampah', category: 'Rumah tangga', unit: 'pack', unitPrice: 10000, monthly: 1, daily: null, priority: 'essential' },
  'gas-lpg': { name: 'Gas LPG 3 kg', category: 'Dapur', unit: 'tabung', unitPrice: 22000, monthly: 2, daily: null, priority: 'essential', unitAliases: ['tabung'] },

  // Belanja bulanan / dapur
  beras: {
    name: 'Beras', category: 'Bahan makanan', unit: 'kg', unitPrice: 14000, monthly: 10, daily: null, priority: 'essential', unitAliases: ['kg', 'kilo'],
    variants: [{ pattern: /beras[^.,;]{0,15}karung|karung[^.,;]{0,10}beras/, unit: 'karung 5 kg', unitPrice: 70000, monthly: 2, daily: null, unitAliases: ['karung'] }],
  },
  'minyak-goreng': { name: 'Minyak goreng', category: 'Bahan makanan', unit: 'liter', unitPrice: 18000, monthly: 2, daily: null, priority: 'essential', unitAliases: ['liter', 'l'] },
  telur: {
    name: 'Telur ayam', category: 'Bahan makanan', unit: 'butir', unitPrice: 2300, monthly: 20, daily: 2, priority: 'essential', unitAliases: ['butir', 'btr'],
    variants: [{ pattern: /telur[^.,;]{0,15}\b(kg|kilo|kilogram)\b|\b(kg|kilo|sekilo)\s+telur/, unit: 'kg', unitPrice: 30000, monthly: 1, daily: 1, unitAliases: ['kg', 'kilo'] }],
  },
  gula: { name: 'Gula pasir', category: 'Bahan makanan', unit: 'kg', unitPrice: 18000, monthly: 1, daily: null, priority: 'optional', unitAliases: ['kg', 'kilo'] },
  bumbu: { name: 'Bumbu dapur dasar', category: 'Bahan makanan', unit: 'paket', unitPrice: 25000, monthly: 1, daily: null, priority: 'essential' },
  sayur: { name: 'Sayuran', category: 'Bahan makanan', unit: 'ikat', unitPrice: 5000, monthly: 12, daily: 2, priority: 'essential', unitAliases: ['ikat'] },
  tahu: { name: 'Tahu', category: 'Bahan makanan', unit: 'bungkus isi 10', unitPrice: 10000, monthly: 4, daily: 1, priority: 'essential', unitAliases: ['bungkus'] },
  tempe: { name: 'Tempe', category: 'Bahan makanan', unit: 'papan', unitPrice: 6000, monthly: 4, daily: 1, priority: 'essential', unitAliases: ['papan', 'potong'] },
  ayam: { name: 'Daging ayam', category: 'Bahan makanan', unit: 'kg', unitPrice: 38000, monthly: 2, daily: 1, priority: 'essential', unitAliases: ['kg', 'kilo'] },

  // Makan & minum
  sarapan: { name: 'Sarapan', category: 'Makan', unit: 'porsi', unitPrice: 12000, monthly: 30, daily: 1, priority: 'essential' },
  'air-minum': { name: 'Air minum botol', category: 'Makan', unit: 'botol', unitPrice: 4000, monthly: 30, daily: 2, priority: 'optional', unitAliases: ['botol'] },
  jajan: { name: 'Jajan / camilan', category: 'Keinginan', unit: 'kali', unitPrice: 10000, monthly: 8, daily: 1, priority: 'optional' },
  'pesan-antar': { name: 'Pesan antar makanan', category: 'Keinginan', unit: 'kali', unitPrice: 30000, monthly: 4, daily: 1, priority: 'optional' },

  // Kesehatan
  vitamin: { name: 'Vitamin C (strip isi 10)', category: 'Kesehatan', unit: 'strip', unitPrice: 15000, monthly: 2, daily: 1, priority: 'essential', unitAliases: ['strip'] },
  'obat-flu': { name: 'Obat flu / batuk', category: 'Kesehatan', unit: 'strip', unitPrice: 12000, monthly: 1, daily: 1, priority: 'essential', unitAliases: ['strip'] },
  masker: { name: 'Masker medis', category: 'Kesehatan', unit: 'box', unitPrice: 25000, monthly: 1, daily: null, priority: 'optional' },
  dokter: { name: 'Konsultasi dokter / klinik', category: 'Kesehatan', unit: 'kali', unitPrice: 75000, monthly: 1, daily: 1, priority: 'essential' },
  p3k: { name: 'Plester & antiseptik', category: 'Kesehatan', unit: 'paket', unitPrice: 20000, monthly: 1, daily: 1, priority: 'optional' },
  gym: { name: 'Membership gym', category: 'Kesehatan', unit: 'bulan', unitPrice: 200000, monthly: 1, daily: null, priority: 'optional' },
  bpjs: { name: 'Iuran BPJS Kesehatan kelas 3', category: 'Tagihan', unit: 'bulan', unitPrice: 42000, monthly: 1, daily: null, priority: 'essential' },

  // Liburan
  'tiket-perjalanan': { name: 'Tiket perjalanan pulang-pergi', category: 'Liburan', unit: 'orang', unitPrice: 300000, monthly: 1, daily: 1, priority: 'essential', unitAliases: ['orang', 'tiket'] },
  penginapan: { name: 'Penginapan', category: 'Liburan', unit: 'malam', unitPrice: 250000, monthly: 2, daily: 1, priority: 'essential', unitAliases: ['malam'] },
  'makan-perjalanan': { name: 'Makan selama perjalanan', category: 'Liburan', unit: 'hari', unitPrice: 75000, monthly: 3, daily: 1, priority: 'essential', unitAliases: ['hari'] },
  'tiket-wisata': { name: 'Tiket masuk wisata', category: 'Liburan', unit: 'orang', unitPrice: 50000, monthly: 2, daily: 1, priority: 'optional', unitAliases: ['orang', 'tiket'] },
  'oleh-oleh': { name: 'Oleh-oleh', category: 'Liburan', unit: 'paket', unitPrice: 100000, monthly: 1, daily: 1, priority: 'optional' },
  sunblock: { name: 'Sunscreen', category: 'Liburan', unit: 'botol', unitPrice: 45000, monthly: 1, daily: 1, priority: 'optional' },

  // Tagihan
  'paket-data': { name: 'Pulsa / paket data', category: 'Tagihan', unit: 'paket', unitPrice: 75000, monthly: 1, daily: null, priority: 'essential' },
  wifi: { name: 'WiFi rumah', category: 'Tagihan', unit: 'bulan', unitPrice: 300000, monthly: 1, daily: null, priority: 'essential' },
  pdam: { name: 'Tagihan air PDAM', category: 'Tagihan', unit: 'bulan', unitPrice: 80000, monthly: 1, daily: null, priority: 'essential' },
  streaming: { name: 'Langganan streaming', category: 'Hiburan', unit: 'bulan', unitPrice: 55000, monthly: 1, daily: null, priority: 'optional' },

  // Hiburan
  bioskop: { name: 'Nonton bioskop', category: 'Hiburan', unit: 'tiket', unitPrice: 50000, monthly: 2, daily: 1, priority: 'optional', unitAliases: ['tiket', 'kali'] },
  nongkrong: { name: 'Nongkrong / hangout', category: 'Hiburan', unit: 'kali', unitPrice: 50000, monthly: 2, daily: 1, priority: 'optional' },
  'top-up-game': { name: 'Top up game', category: 'Hiburan', unit: 'kali', unitPrice: 50000, monthly: 1, daily: 1, priority: 'optional' },

  // Tabungan
  tabungan: { name: 'Setoran tabungan', category: 'Tabungan', unit: 'setoran', unitPrice: 300000, monthly: 1, daily: 1, dailyUnitPrice: 15000, priority: 'essential' },
  'dana-darurat': { name: 'Dana darurat', category: 'Cadangan', unit: 'alokasi', unitPrice: 150000, monthly: 1, daily: 1, dailyUnitPrice: 10000, priority: 'essential' },
}

export const CONTEXTS: Record<ContextId, ContextDef> = {
  kuliah: { label: 'Kuliah & tugas', keywords: ['mahasiswa', 'mahasiswi', 'kuliah', 'kampus', 'semester', 'skripsi', 'dosen', 'praktikum', 'ujian', 'uts', 'uas', 'tugas kuliah', 'jurusan'], templates: ['kuliah-kerja'], core: ['transport-kampus'] },
  kerja: { label: 'Kerja & magang', keywords: ['kerja', 'kantor', 'ngantor', 'magang', 'intern', 'internship', 'karyawan', 'pegawai', 'wfo', 'kerja praktik'], templates: ['kuliah-kerja'], core: ['transport-kantor', 'makan-siang-kerja'] },
  kos: { label: 'Anak kos', keywords: ['kos', 'kost', 'kosan', 'kostan', 'ngekos', 'ngekost', 'indekos', 'anak kos'], templates: ['anak-kos'], core: ['makan-harian', 'galon', 'laundry', 'sabun-mandi', 'pasta-gigi', 'sampo'] },
  rumah: { label: 'Kebutuhan rumah', keywords: ['rumah tangga', 'kebutuhan rumah', 'bersih bersih', 'bersih-bersih', 'kamar'], templates: ['belanja-kamar'], core: ['sabun-cuci-piring', 'pembersih-lantai', 'tisu', 'kantong-sampah', 'deterjen'] },
  belanja: { label: 'Belanja bulanan', keywords: ['belanja bulanan', 'sembako', 'stok dapur', 'groceries', 'belanja dapur'], templates: [], core: ['beras', 'minyak-goreng', 'telur', 'gula', 'bumbu'] },
  makan: { label: 'Makan & minum', keywords: ['uang makan', 'biaya makan', 'makan harian', 'makan sehari hari', 'makan dan minum', 'kuliner'], templates: ['makan-minum'], core: ['makan-harian', 'air-minum'] },
  transportasi: { label: 'Transportasi', keywords: ['transport', 'transportasi', 'perjalanan harian', 'commute', 'pulang pergi'], templates: ['transportasi'], core: ['transport-umum'] },
  kesehatan: { label: 'Kesehatan', keywords: ['kesehatan', 'sehat', 'sakit', 'berobat'], templates: ['kesehatan'], core: ['vitamin'] },
  liburan: { label: 'Liburan', keywords: ['liburan', 'libur', 'jalan jalan', 'jalan-jalan', 'traveling', 'travelling', 'travel', 'mudik', 'pulang kampung', 'wisata', 'staycation', 'piknik', 'trip'], templates: [], core: ['tiket-perjalanan', 'makan-perjalanan'] },
  hiburan: { label: 'Hiburan', keywords: ['hiburan', 'refreshing', 'healing', 'senang senang'], templates: ['hiburan'], core: ['nongkrong', 'bioskop'] },
  tagihan: { label: 'Tagihan', keywords: ['tagihan', 'bayar bulanan', 'iuran'], templates: ['tagihan-bulanan'], core: ['paket-data', 'token-listrik'] },
  tabungan: { label: 'Tabungan', keywords: ['nabung', 'menabung', 'tabungan', 'investasi'], templates: ['target-menabung'], core: ['tabungan', 'dana-darurat'] },
  harian: { label: 'Kebutuhan sehari-hari', keywords: ['sehari hari', 'sehari-hari', 'kebutuhan harian', 'kebutuhan pokok'], templates: ['harian-dasar'], core: ['makan-harian', 'transport-umum', 'air-minum'] },
}

const TRANSPORT_DEFAULTS = ['transport-umum', 'transport-kampus', 'transport-kantor']

export const BUNDLES: Bundle[] = [
  // Kuliah
  { context: 'kuliah', keywords: ['maket', 'mockup fisik', 'model arsitektur'], items: ['karton-maket', 'lem-kertas', 'cutter', 'isi-cutter', 'penggaris-besi', 'cutting-mat'] },
  { context: 'kuliah', keywords: ['karton', 'duplex', 'board'], items: ['karton-maket'] },
  { context: 'kuliah', keywords: ['lem', 'uhu'], items: ['lem-kertas'] },
  { context: 'kuliah', keywords: ['cutter', 'pisau potong'], items: ['cutter'] },
  { context: 'kuliah', keywords: ['penggaris'], items: ['penggaris-besi'] },
  { context: 'kuliah', keywords: ['kertas', 'hvs'], items: ['kertas-hvs'] },
  { context: 'kuliah', keywords: ['print', 'printing', 'nge-print', 'ngeprint', 'cetak', 'presentasi', 'handout'], items: ['print-dokumen'] },
  { context: 'kuliah', keywords: ['print warna', 'cetak warna', 'poster', 'portofolio'], items: ['print-warna'] },
  { context: 'kuliah', keywords: ['laporan', 'jilid', 'menjilid', 'penjilidan', 'makalah', 'proposal', 'skripsi'], items: ['jilid'] },
  { context: 'kuliah', keywords: ['fotokopi', 'fotocopy', 'modul', 'materi'], items: ['fotokopi'] },
  { context: 'kuliah', keywords: ['alat tulis', 'pulpen', 'pena', 'pensil', 'stabilo'], items: ['alat-tulis'] },
  { context: 'kuliah', keywords: ['buku tulis', 'buku catatan', 'binder'], items: ['buku-tulis'] },
  { context: 'kuliah', keywords: ['praktikum', 'lab'], items: ['biaya-praktikum'] },

  // Kerja
  { context: 'kerja', keywords: ['kopi', 'ngopi', 'coffee', 'cafe', 'kafe', 'wfc'], items: ['kopi'] },
  { context: 'kerja', keywords: ['kemeja', 'pakaian kerja', 'baju kerja', 'baju kantor', 'dress code', 'formal'], items: ['pakaian-kerja'] },
  { context: 'kerja', keywords: ['makan siang'], items: ['makan-siang-kerja'] },

  // Transportasi (specific modes replace the generic trip line)
  { context: 'transportasi', keywords: ['krl', 'commuter line', 'commuterline', 'kereta', 'mrt', 'lrt'], items: ['krl', 'ojek-stasiun'], supersedes: TRANSPORT_DEFAULTS },
  { context: 'transportasi', keywords: ['busway', 'transjakarta', 'tije', 'angkot', 'bus kota', 'trans jateng', 'suroboyo bus', 'bus'], items: ['busway'], supersedes: TRANSPORT_DEFAULTS },
  { context: 'transportasi', keywords: ['ojek', 'ojol', 'gojek', 'grab', 'maxim', 'gocar', 'grabbike'], items: ['ojol'], supersedes: TRANSPORT_DEFAULTS },
  { context: 'transportasi', keywords: ['bensin', 'motor', 'pertalite', 'pertamax', 'bbm', 'naik motor', 'mobil'], items: ['bensin', 'parkir'], supersedes: TRANSPORT_DEFAULTS },
  { context: 'transportasi', keywords: ['parkir'], items: ['parkir'] },
  { context: 'transportasi', keywords: ['oli', 'servis', 'service motor', 'bengkel'], items: ['ganti-oli'] },

  // Kos
  { context: 'kos', keywords: ['sewa kos', 'bayar kos', 'uang kos', 'biaya kos', 'sewa kamar', 'sewa kost', 'bayar kost'], items: ['sewa-kos'] },
  { context: 'kos', keywords: ['galon', 'air galon', 'air minum'], items: ['galon'] },
  { context: 'kos', keywords: ['laundry', 'londri', 'laundri'], items: ['laundry'] },
  { context: 'kos', keywords: ['mie', 'mi instan', 'indomie', 'mie instan'], items: ['mi-instan'] },
  { context: 'kos', keywords: ['sabun mandi', 'mandi', 'toiletries', 'perlengkapan mandi'], items: ['sabun-mandi', 'sampo', 'pasta-gigi'] },
  { context: 'kos', keywords: ['sampo', 'shampoo'], items: ['sampo'] },
  { context: 'kos', keywords: ['odol', 'pasta gigi'], items: ['pasta-gigi'] },

  // Rumah tangga
  { context: 'rumah', keywords: ['deterjen', 'detergen', 'rinso', 'cuci baju', 'nyuci', 'cuci sendiri', 'nyuci sendiri'], items: ['deterjen'], supersedes: ['laundry'] },
  { context: 'rumah', keywords: ['pewangi', 'pelembut', 'molto', 'downy'], items: ['pewangi'] },
  { context: 'rumah', keywords: ['sabun cuci piring', 'cuci piring', 'sunlight'], items: ['sabun-cuci-piring'] },
  { context: 'rumah', keywords: ['pel', 'ngepel', 'pembersih lantai', 'bersihin lantai'], items: ['pembersih-lantai'] },
  { context: 'rumah', keywords: ['tisu', 'tissue'], items: ['tisu'] },
  { context: 'rumah', keywords: ['sampah', 'kantong sampah', 'plastik sampah'], items: ['kantong-sampah'] },
  { context: 'rumah', keywords: ['gas', 'lpg', 'elpiji'], items: ['gas-lpg'] },

  // Belanja / dapur
  { context: 'belanja', keywords: ['masak sendiri', 'masak', 'memasak', 'dapur'], items: ['beras', 'minyak-goreng', 'bumbu', 'gas-lpg'] },
  { context: 'belanja', keywords: ['masak sendiri'], items: [], supersedes: ['makan-harian'] },
  { context: 'belanja', keywords: ['beras', 'nasi'], items: ['beras'] },
  { context: 'belanja', keywords: ['minyak', 'minyak goreng'], items: ['minyak-goreng'] },
  { context: 'belanja', keywords: ['telur', 'telor'], items: ['telur'] },
  { context: 'belanja', keywords: ['gula'], items: ['gula'] },
  { context: 'belanja', keywords: ['bumbu', 'garam', 'kecap', 'bawang'], items: ['bumbu'] },
  { context: 'belanja', keywords: ['sayur', 'sayuran', 'bayam', 'kangkung', 'wortel'], items: ['sayur'] },
  { context: 'belanja', keywords: ['tahu'], items: ['tahu'] },
  { context: 'belanja', keywords: ['tempe'], items: ['tempe'] },
  { context: 'belanja', keywords: ['ayam', 'daging ayam'], items: ['ayam'] },

  // Makan
  { context: 'makan', keywords: ['sarapan'], items: ['sarapan'] },
  { context: 'makan', keywords: ['jajan', 'camilan', 'cemilan', 'snack'], items: ['jajan'] },
  { context: 'makan', keywords: ['gofood', 'grabfood', 'shopeefood', 'pesan antar', 'delivery', 'pesan makanan'], items: ['pesan-antar'] },

  // Kesehatan
  { context: 'kesehatan', keywords: ['vitamin', 'suplemen'], items: ['vitamin'] },
  { context: 'kesehatan', keywords: ['flu', 'pilek', 'batuk', 'demam', 'pusing', 'obat', 'meriang'], items: ['obat-flu'] },
  { context: 'kesehatan', keywords: ['masker'], items: ['masker'] },
  { context: 'kesehatan', keywords: ['dokter', 'klinik', 'periksa', 'puskesmas', 'berobat'], items: ['dokter'] },
  { context: 'kesehatan', keywords: ['p3k', 'luka', 'plester', 'antiseptik', 'betadine'], items: ['p3k'] },
  { context: 'kesehatan', keywords: ['gym', 'fitness', 'fitnes', 'olahraga'], items: ['gym'] },
  { context: 'kesehatan', keywords: ['bpjs'], items: ['bpjs'] },

  // Liburan
  { context: 'liburan', keywords: ['hotel', 'penginapan', 'nginep', 'menginap', 'villa', 'homestay', 'airbnb', 'staycation', 'liburan', 'wisata'], items: ['penginapan'] },
  { context: 'liburan', keywords: ['tiket pesawat', 'tiket kereta', 'tiket bus', 'pesawat'], items: ['tiket-perjalanan'] },
  { context: 'liburan', keywords: ['wisata', 'tiket masuk', 'museum', 'pantai', 'kebun binatang', 'taman hiburan'], items: ['tiket-wisata'] },
  { context: 'liburan', keywords: ['oleh oleh', 'oleh-oleh', 'mudik', 'pulang kampung', 'souvenir'], items: ['oleh-oleh'] },
  { context: 'liburan', keywords: ['pantai', 'sunblock', 'sunscreen'], items: ['sunblock'] },

  // Tagihan
  { context: 'tagihan', keywords: ['pulsa', 'kuota', 'paket data', 'data internet', 'zoom', 'kuliah online'], items: ['paket-data'] },
  { context: 'tagihan', keywords: ['wifi', 'indihome', 'internet rumah', 'biznet', 'first media'], items: ['wifi'] },
  { context: 'tagihan', keywords: ['listrik', 'token', 'pln'], items: ['token-listrik'] },
  { context: 'tagihan', keywords: ['pdam', 'tagihan air'], items: ['pdam'] },
  { context: 'tagihan', keywords: ['netflix', 'spotify', 'youtube premium', 'disney', 'langganan', 'streaming'], items: ['streaming'] },

  // Hiburan
  { context: 'hiburan', keywords: ['nonton', 'bioskop', 'film', 'xxi', 'cgv'], items: ['bioskop'] },
  { context: 'hiburan', keywords: ['nongkrong', 'hangout', 'main bareng', 'ketemu teman'], items: ['nongkrong'] },
  { context: 'hiburan', keywords: ['game', 'top up', 'topup', 'diamond'], items: ['top-up-game'] },

  // Tabungan
  { context: 'tabungan', keywords: ['nabung', 'menabung', 'tabungan', 'investasi'], items: ['tabungan'] },
  { context: 'tabungan', keywords: ['dana darurat', 'darurat', 'cadangan'], items: ['dana-darurat'] },
]

export type Recommendation = Material & {
  id: string
  itemKey: string
  unit: string
  priority: Priority
  reason: string
}

export type DetectedContext = { id: ContextId; label: string; source: 'template' | 'deskripsi' }

export type RecommendationInput = {
  description: string
  period: Period
  templateType?: TemplateType | null
}

export type RecommendationResult = {
  items: Recommendation[]
  contexts: DetectedContext[]
  matchedKeywords: string[]
  usedFallback: boolean
}

export function normalizeText(text: string) {
  return ` ${text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim()} `
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function keywordRegex(keyword: string) {
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(keyword)}(?:nya|ku|mu|an)?(?=[^a-z0-9]|$)`)
}

function findKeywords(text: string, keywords: string[]) {
  return keywords.filter((keyword) => keywordRegex(keyword).test(text))
}

function extractQuantity(text: string, keyword: string, unitAliases: string[]) {
  const kw = escapeRegExp(keyword)
  const units = unitAliases.map(escapeRegExp).join('|')
  const before = new RegExp(`(?:^|[^a-z0-9])(\\d{1,3})\\s+(?:(?:${units})\\s+)?${kw}`)
  const after = units ? new RegExp(`${kw}\\s+(?:[a-z]+\\s+){0,2}?(\\d{1,3})\\s*(?:${units})(?=[^a-z]|$)`) : null
  const match = text.match(before) ?? (after ? text.match(after) : null)
  const value = match ? Number(match[1]) : NaN
  return Number.isInteger(value) && value > 0 ? value : null
}

function contextsForTemplate(templateType?: TemplateType | null) {
  if (!templateType) return [] as ContextId[]
  return (Object.keys(CONTEXTS) as ContextId[]).filter((id) => CONTEXTS[id].templates.includes(templateType))
}

export function generateRecommendations({ description, period, templateType }: RecommendationInput): RecommendationResult {
  const text = normalizeText(description)
  const matchedKeywords = new Set<string>()
  const textContexts = new Set<ContextId>()

  for (const id of Object.keys(CONTEXTS) as ContextId[]) {
    const hits = findKeywords(text, CONTEXTS[id].keywords)
    if (hits.length) {
      textContexts.add(id)
      hits.forEach((hit) => matchedKeywords.add(hit))
    }
  }

  const itemReasons = new Map<string, Set<string>>()
  const superseded = new Set<string>()
  const bundleContexts = new Set<ContextId>()

  for (const bundle of BUNDLES) {
    const hits = findKeywords(text, bundle.keywords)
    if (!hits.length) continue
    hits.forEach((hit) => matchedKeywords.add(hit))
    bundleContexts.add(bundle.context)
    bundle.supersedes?.forEach((key) => superseded.add(key))
    for (const key of bundle.items) {
      if (!itemReasons.has(key)) itemReasons.set(key, new Set())
      hits.forEach((hit) => itemReasons.get(key)!.add(`"${hit}"`))
    }
  }

  const templateContexts = contextsForTemplate(templateType)
  const overlap = templateContexts.filter((id) => textContexts.has(id))
  let coreContexts: ContextId[]
  let usedFallback = false

  if (overlap.length || textContexts.size) {
    coreContexts = [...textContexts]
  } else if (itemReasons.size) {
    coreContexts = []
  } else if (templateContexts.length) {
    coreContexts = templateContexts
  } else {
    coreContexts = ['harian']
    usedFallback = true
  }

  for (const id of coreContexts) {
    for (const key of CONTEXTS[id].core) {
      if (itemReasons.has(key)) continue
      const source = textContexts.has(id) ? 'konteks' : 'template'
      itemReasons.set(key, new Set([`${source} ${CONTEXTS[id].label}`]))
    }
  }

  const keywordsByItem = new Map<string, string[]>()
  for (const bundle of BUNDLES) {
    const hits = findKeywords(text, bundle.keywords)
    if (!hits.length) continue
    for (const key of bundle.items) keywordsByItem.set(key, [...(keywordsByItem.get(key) ?? []), ...hits])
  }

  const stamp = Date.now()
  const items: Recommendation[] = []

  for (const [key, reasons] of itemReasons) {
    const def = ITEMS[key]
    if (!def) continue
    const explicitlyMentioned = keywordsByItem.has(key)
    if (superseded.has(key) && !explicitlyMentioned) continue

    const variant = def.variants?.find((option) => option.pattern.test(text))
    const unit = variant?.unit ?? def.unit
    const baseQty = period === 'daily' ? (variant ? variant.daily : def.daily) : variant ? variant.monthly : def.monthly
    if (baseQty === null) continue

    const unitPrice = period === 'daily' && !variant && def.dailyUnitPrice ? def.dailyUnitPrice : variant?.unitPrice ?? def.unitPrice
    const aliases = [...new Set([unit, ...(variant?.unitAliases ?? def.unitAliases ?? [])])]
    const statedQty = (keywordsByItem.get(key) ?? []).map((kw) => extractQuantity(text, kw, aliases)).find((qty) => qty !== null) ?? null
    const quantity = statedQty ?? baseQty

    items.push({
      id: `rec-${stamp}-${items.length}`,
      itemKey: key,
      name: def.name,
      category: `${def.category} · ${unit}`,
      unit,
      quantity,
      unitPrice,
      actualPrice: null,
      isPurchased: false,
      priority: def.priority,
      reason: `${statedQty ? 'jumlah dari deskripsi, ' : ''}dari ${[...reasons].join(', ')}`,
    })
  }

  const contextIds = new Set<ContextId>([...textContexts, ...bundleContexts, ...coreContexts])
  const contexts: DetectedContext[] = [...contextIds].map((id) => ({
    id,
    label: CONTEXTS[id].label,
    source: textContexts.has(id) || bundleContexts.has(id) ? 'deskripsi' : 'template',
  }))

  return { items, contexts, matchedKeywords: [...matchedKeywords], usedFallback }
}

export const itemTotal = (item: Pick<Material, 'quantity' | 'unitPrice'>) => Math.max(0, item.unitPrice || 0) * Math.max(1, item.quantity || 1)

export type BudgetSuggestion = { id: string; kind: 'remove' | 'reduce'; name: string; saving: number; newQuantity?: number }

export type BudgetAnalysis =
  | { status: 'none'; total: number }
  | { status: 'within'; total: number; budget: number; remaining: number }
  | { status: 'over'; total: number; budget: number; over: number; optionalTotal: number; suggestions: BudgetSuggestion[]; stillOverAfterSuggestions: number }

type AnalyzableItem = Pick<Material, 'name' | 'quantity' | 'unitPrice'> & { id?: string; priority?: Priority }

export function analyzeBudget(items: AnalyzableItem[], budget: number | null): BudgetAnalysis {
  const total = items.reduce((sum, item) => sum + itemTotal(item), 0)
  if (!budget || budget <= 0) return { status: 'none', total }
  if (total <= budget) return { status: 'within', total, budget, remaining: budget - total }

  const over = total - budget
  const suggestions: BudgetSuggestion[] = []
  let covered = 0

  const optional = items.filter((item) => item.priority === 'optional' && item.unitPrice > 0).sort((a, b) => itemTotal(b) - itemTotal(a))
  const optionalTotal = optional.reduce((sum, item) => sum + itemTotal(item), 0)
  for (const item of optional) {
    if (covered >= over) break
    const remainingGap = over - covered
    // Propose cutting just enough optional units when possible instead of dropping the entire item.
    const cut = Math.min(item.quantity, Math.ceil(remainingGap / item.unitPrice))
    if (cut <= 0) continue
    const saving = cut * item.unitPrice
    if (cut < item.quantity) {
      suggestions.push({ id: item.id ?? item.name, kind: 'reduce', name: item.name, saving, newQuantity: item.quantity - cut })
    } else {
      suggestions.push({ id: item.id ?? item.name, kind: 'remove', name: item.name, saving })
    }
    covered += saving
  }

  if (covered < over) {
    // Essential quantities require user judgment: suggest at most a 25% reduction,
    // always keep at least one unit, and never apply changes without confirmation.
    const reducible = items
      .filter((item) => item.priority !== 'optional' && item.quantity > 1 && item.unitPrice > 0)
      .sort((a, b) => itemTotal(b) - itemTotal(a))
    for (const item of reducible) {
      if (covered >= over) break
      const maxCut = Math.min(item.quantity - 1, Math.floor(item.quantity * 0.25))
      if (maxCut <= 0) continue
      const cut = Math.min(maxCut, Math.ceil((over - covered) / item.unitPrice))
      const saving = cut * item.unitPrice
      suggestions.push({ id: item.id ?? item.name, kind: 'reduce', name: item.name, saving, newQuantity: item.quantity - cut })
      covered += saving
    }
  }

  return { status: 'over', total, budget, over, optionalTotal, suggestions, stillOverAfterSuggestions: Math.max(0, over - covered) }
}
