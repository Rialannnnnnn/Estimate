import { Lightbulb } from 'lucide-react'

const reminders = [
  'Mulai dari kebutuhan yang paling penting.',
  'Catat harga setelah belanja agar realisasi tetap akurat.',
  'Sisakan sedikit ruang budget untuk hal tak terduga.',
]

export function DashboardAside({ displayName }: { displayName: string }) {
  return (
    <aside aria-label="Pengingat budget" className="xl:sticky xl:top-28">
      <div className="rounded-3xl border border-soft-blue/70 bg-card/80 p-6 shadow-[0_10px_30px_rgba(23,63,95,.05)] backdrop-blur">
        <p className="text-label text-muted-foreground">Selamat datang</p>
        <p className="mt-1 truncate text-lg font-semibold text-foreground">{displayName}</p>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
          Kelola kebutuhanmu dengan lebih tenang. Budget yang rapi membantu keputusan belanja yang lebih bijak.
        </p>

        <div className="mt-6 border-t border-soft-blue/60 pt-5">
          <div className="flex items-center gap-2 text-primary">
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Pengingat kecil</h2>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {reminders.map((reminder) => (
              <li key={reminder} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" aria-hidden="true" />
                <span className="text-pretty">{reminder}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
