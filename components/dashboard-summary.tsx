interface DashboardSummaryProps {
  projects: { budget: number; spent: number }[]
}

const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`

export function DashboardSummary({ projects }: DashboardSummaryProps) {
  const totalBudget = projects.reduce((sum, project) => sum + (Number(project.budget) || 0), 0)
  const totalSpent = projects.reduce((sum, project) => sum + (Number(project.spent) || 0), 0)
  const remaining = totalBudget - totalSpent

  const items = [
    { label: 'Total Rencana Budget', value: `${projects.length} rencana` },
    { label: 'Total Anggaran', value: formatRupiah(totalBudget) },
    { label: 'Sisa Anggaran', value: formatRupiah(remaining), negative: remaining < 0 },
  ]

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="surface-card min-w-0 rounded-2xl border border-soft-blue bg-card px-5 py-4 hover:border-brand-secondary/30 hover:bg-popover"
        >
          <dt className="text-label text-muted-foreground">{item.label}</dt>
          <dd
            className={`mt-2 break-words text-xl font-bold tabular-nums ${
              item.negative ? 'text-danger-text dark:text-destructive' : 'text-foreground'
            }`}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
