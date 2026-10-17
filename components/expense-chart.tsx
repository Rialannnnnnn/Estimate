'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface Material {
  id?: string
  name: string
  category: string
  quantity: number
  unitPrice: number
  actualPrice?: number | null
}

interface ExpenseChartProps {
  materials: Material[]
  title?: string
}

const COLORS = [
  '#173F5F',
  '#9DC3DE',
  '#397BA8',
  '#DCEAF5',
  '#245C85',
  '#B9D4E8',
  '#0F2E47',
  '#7FB0D3',
  '#2F6E99',
  '#C9DDEC',
]

const LIGHT_SLICE_INDEXES = new Set([1, 3, 5, 7, 9])
const DARK_TEXT = '#17324D'
const LIGHT_TEXT = '#FFFFFF'
const RADIAN = Math.PI / 180

interface SliceLabelProps {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
  index: number
}

function renderSliceLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: SliceLabelProps) {
  if (percent < 0.06) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  const colorIndex = index % COLORS.length
  return (
    <text
      x={x}
      y={y}
      fill={LIGHT_SLICE_INDEXES.has(colorIndex) ? DARK_TEXT : LIGHT_TEXT}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={13}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function ExpenseChart({ materials, title = 'Breakdown Pengeluaran' }: ExpenseChartProps) {
  const chartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {}

    materials.forEach((material) => {
      const cost = material.actualPrice ?? material.quantity * material.unitPrice
      categoryTotals[material.category] = (categoryTotals[material.category] || 0) + cost
    })

    return Object.entries(categoryTotals)
      .map(([category, value]) => ({
        name: category,
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value)
  }, [materials])

  const totalSpent = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0)
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center rounded-xl border-2 border-dashed border-soft-blue">
        <p className="text-ink-muted text-mono-sm">Belum ada material</p>
      </div>
    )
  }

  const getPercentage = (value: number, digits = 1) =>
    totalSpent > 0 ? ((value / totalSpent) * 100).toFixed(digits) : '0'

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="rounded-xl border border-soft-blue bg-card p-3 shadow-md">
          <p className="text-ink font-bold text-sm">{data.name}</p>
          <p className="text-ink text-mono-sm">
            Rp {data.value.toLocaleString('id-ID')}
          </p>
          <p className="text-ink-muted text-xs">{getPercentage(data.value)}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <h3 className="text-lg font-bold text-primary">{title}</h3>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Chart + legend */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="mx-auto aspect-square w-full max-w-72 sm:max-w-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderSliceLabel as any}
                  outerRadius="95%"
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2" aria-label="Legenda kategori">
            {chartData.map((item, index) => (
              <li key={item.name} className="flex items-center gap-2 text-sm text-ink">
                <span
                  className="h-3 w-3 shrink-0 rounded-sm border border-soft-blue"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="break-words">{item.name}</span>
                <span className="font-mono text-ink-muted">{getPercentage(item.value, 0)}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Category details */}
        <div className="flex min-w-0 flex-col gap-3">
          <h4 className="text-base font-semibold text-primary">Detail Kategori</h4>
          <ul className="flex flex-col">
            {chartData.map((item, index) => (
              <li
                key={item.name}
                className="flex items-center justify-between gap-4 border-b border-soft-blue py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-sm border border-soft-blue"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words text-sm font-medium text-ink">{item.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-bold text-ink">
                    Rp {item.value.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-ink-muted">{getPercentage(item.value)}%</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-ice-blue px-3 py-3">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="font-mono text-base font-bold text-primary">
              Rp {totalSpent.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
