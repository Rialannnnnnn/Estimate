export const mindsetQuestions = [
  { question: 'Begitu gaji masuk, hal pertama yang kamu lakukan?', options: ['sisihkan tabungan/investasi dulu', 'bayar tagihan dan cicilan dulu', 'belanja keinginan dulu', 'biarkan di rekening dulu', 'langsung bagi ke beberapa pos'] },
  { question: 'Berapa persen yang langsung kamu sisihkan sebelum belanja?', options: ['0-10', '11-20', '21-30', '>30'] },
  { question: 'Pengeluaran terbesar setelah gajian?', options: ['makan harian', 'kos dan transport', 'cicilan/utang', 'hiburan', 'keluarga'] },
  { question: 'Kamu pakai paylater atau kartu kredit?', options: ['tidak pernah', 'pernah sesekali', 'sering', 'sedang aktif di beberapa tagihan'] },
  { question: 'Kamu mencatat pengeluaran?', options: ['tiap hari', 'kadang-kadang', 'akhir bulan', 'tidak pernah'] },
  { question: 'Dapat uang tak terduga (bonus/THR), kamu...', options: ['tabung atau investasi', 'bayar utang', 'beli barang yang diincar', 'traktir orang'] },
  { question: 'Yang paling sering bikin boncos?', options: ['jajan dan kopi', 'makan di luar', 'online shopping', 'hobi', 'diskon dan flash sale'] },
] as const

const optionScores = [
  [3, 2, 0, 1, 3], [0, 1, 2, 3], [1, 2, 3, 0, 2], [3, 2, 0, 0], [3, 2, 1, 0], [3, 2, 0, 1], [1, 1, 0, 1, 0],
]
export type MindsetAllocation = { wajib: number; variabel: number; tabungan: number }
export function scoreMindset(answers: Record<number, number>) {
  const score = Object.entries(answers).reduce((sum, [question, option]) => sum + (optionScores[Number(question)]?.[option] ?? 0), 0)
  if (score >= 15) return { score, type: 'Penabung Otomatis', allocation: { wajib: 50, variabel: 30, tabungan: 20 } satisfies MindsetAllocation }
  if (score >= 10) return { score, type: 'Pembayar Tagihan Dulu', allocation: { wajib: 60, variabel: 25, tabungan: 15 } satisfies MindsetAllocation }
  if (score >= 5) return { score, type: 'Spender Reaktif', allocation: { wajib: 50, variabel: 40, tabungan: 10 } satisfies MindsetAllocation }
  return { score, type: 'Belum Terencana', allocation: { wajib: 45, variabel: 40, tabungan: 15 } satisfies MindsetAllocation }
}
export function mindsetInterpretation(type: string) {
  return `${type} menggambarkan kebiasaan yang terlihat dari jawabanmu saat ini, bukan label tetap. Alokasi awal ini bisa kamu sesuaikan kapan saja agar lebih cocok dengan kebutuhan dan tujuanmu.`
}
