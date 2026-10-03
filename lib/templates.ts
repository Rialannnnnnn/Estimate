export type TemplateType =
  | 'harian-dasar'
  | 'anak-kos'
  | 'transportasi'
  | 'makan-minum'
  | 'tagihan-bulanan'
  | 'belanja-kamar'
  | 'kesehatan'
  | 'hiburan'
  | 'kuliah-kerja'
  | 'target-menabung'

export interface TemplateItem {
  name: string
  category: string
  quantity: number
  unitPrice: number
}

export interface Template {
  type: TemplateType
  name: string
  description: string
  budget: number
  defaultItems: TemplateItem[]
}

const item = (name: string, category: string, quantity: number, unitPrice: number): TemplateItem => ({ name, category, quantity, unitPrice })

export const templates: Record<TemplateType, Template> = {
  'harian-dasar': {
    type: 'harian-dasar', name: 'Kebutuhan Harian Dasar', description: 'Rencanakan pengeluaran wajib untuk satu hari tanpa pengeluaran impulsif.', budget: 85000,
    defaultItems: [item('Sarapan', 'Makan', 1, 15000), item('Makan siang', 'Makan', 1, 25000), item('Transportasi', 'Mobilitas', 1, 15000), item('Minum dan camilan', 'Makan', 1, 10000), item('Dana cadangan', 'Cadangan', 1, 20000)],
  },
  'anak-kos': {
    type: 'anak-kos', name: 'Budget Anak Kos', description: 'Atur kebutuhan rutin anak kos agar uang bulanan tidak habis di awal.', budget: 1500000,
    defaultItems: [item('Makan harian', 'Makan', 30, 30000), item('Laundry', 'Rumah', 4, 25000), item('Transportasi', 'Mobilitas', 20, 10000), item('Pulsa dan data', 'Tagihan', 1, 100000), item('Dana darurat', 'Cadangan', 1, 150000)],
  },
  'transportasi': {
    type: 'transportasi', name: 'Transportasi Bulanan', description: 'Hitung kebutuhan perjalanan rutin sekolah, kuliah, atau kerja.', budget: 600000,
    defaultItems: [item('Ojek atau bus', 'Mobilitas', 20, 15000), item('Bensin', 'Mobilitas', 4, 50000), item('Parkir', 'Mobilitas', 20, 5000), item('Transportasi cadangan', 'Cadangan', 1, 100000)],
  },
  'makan-minum': {
    type: 'makan-minum', name: 'Makan & Minum Bulanan', description: 'Pisahkan budget makan wajib dari jajan dan pesan antar.', budget: 1200000,
    defaultItems: [item('Makan utama', 'Makan', 30, 25000), item('Sarapan', 'Makan', 20, 12000), item('Minum', 'Makan', 30, 5000), item('Jajan terencana', 'Keinginan', 4, 30000)],
  },
  'tagihan-bulanan': {
    type: 'tagihan-bulanan', name: 'Tagihan Bulanan', description: 'Catat tagihan rutin yang harus dibayar sebelum pengeluaran lain.', budget: 850000,
    defaultItems: [item('Pulsa dan data', 'Tagihan', 1, 150000), item('Listrik atau kos', 'Tagihan', 1, 400000), item('Langganan digital', 'Hiburan', 2, 50000), item('Iuran rutin', 'Tagihan', 1, 100000), item('Buffer tagihan', 'Cadangan', 1, 100000)],
  },
  'belanja-kamar': {
    type: 'belanja-kamar', name: 'Belanja Kamar & Rumah', description: 'Susun daftar kebutuhan rumah supaya belanja lebih terarah.', budget: 350000,
    defaultItems: [item('Sabun dan toiletries', 'Rumah', 1, 90000), item('Detergen', 'Rumah', 1, 45000), item('Tisu', 'Rumah', 2, 25000), item('Perlengkapan kebersihan', 'Rumah', 1, 75000), item('Stok makanan', 'Makan', 1, 115000)],
  },
  'kesehatan': {
    type: 'kesehatan', name: 'Kesehatan & Perawatan', description: 'Prioritaskan kesehatan dan perawatan rutin dalam anggaran.', budget: 400000,
    defaultItems: [item('Vitamin atau obat rutin', 'Kesehatan', 1, 150000), item('Perawatan diri', 'Perawatan', 1, 125000), item('Olahraga', 'Kesehatan', 1, 75000), item('Dana konsultasi', 'Cadangan', 1, 50000)],
  },
  'hiburan': {
    type: 'hiburan', name: 'Hiburan Terkontrol', description: 'Tetap bersenang-senang dengan batas yang jelas dan aman.', budget: 300000,
    defaultItems: [item('Nonton atau aktivitas', 'Hiburan', 2, 60000), item('Hangout', 'Hiburan', 2, 50000), item('Game atau digital', 'Hiburan', 1, 50000), item('Buffer sosial', 'Keinginan', 1, 30000)],
  },
  'kuliah-kerja': {
    type: 'kuliah-kerja', name: 'Kuliah & Kerja', description: 'Kelola biaya produktivitas, tugas, dan kebutuhan kerja harian.', budget: 550000,
    defaultItems: [item('Print dan fotokopi', 'Produktivitas', 1, 75000), item('Alat tulis', 'Produktivitas', 1, 85000), item('Internet tambahan', 'Tagihan', 1, 100000), item('Kopi atau ruang kerja', 'Produktivitas', 4, 40000), item('Transportasi', 'Mobilitas', 10, 15000)],
  },
  'target-menabung': {
    type: 'target-menabung', name: 'Target Menabung', description: 'Buat rencana kebutuhan dan sisihkan uang untuk tujuan yang penting.', budget: 1000000,
    defaultItems: [item('Kebutuhan wajib', 'Kebutuhan', 1, 500000), item('Tabungan target', 'Tabungan', 1, 300000), item('Dana darurat', 'Cadangan', 1, 150000), item('Uang fleksibel', 'Keinginan', 1, 50000)],
  },
}

export const templateList = Object.values(templates)

export function getTemplate(type: TemplateType) {
  return templates[type]
}

export function getTemplateTotal(template: Template) {
  return template.defaultItems.reduce((total, current) => total + current.quantity * current.unitPrice, 0)
}

export function formatTemplateCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}
