'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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
  '#FFFFFF',
  '#C2DDF4',
  '#799CCB',
  '#4477DD',
  '#4866AF',
  '#2952A3',
  '#1A3D7A',
  '#818CF8',
  '#A5B4FC',
  '#E0E7FF',
]

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
      <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-white/20">
        <p className="text-white/60 text-mono-sm">Belum ada material</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = ((data.value / totalSpent) * 100).toFixed(1)
      return (
        <div className="bg-brand-blue border-2 border-white p-3">
          <p className="text-white font-bold text-label">{data.name}</p>
          <p className="text-white text-mono-sm">
            Rp {data.value.toLocaleString('id-ID')}
          </p>
          <p className="text-white/70 text-label">{percentage}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full space-y-4">
      <h3 className="text-label font-bold text-white/90">{title}</h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => {
              if (percent < 0.05) return null
              return `${name} ${(percent * 100).toFixed(0)}%`
            }}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1A3D7A" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical" 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value, entry) => {
              const data = entry.payload as { value?: number } | undefined
              const amount = data?.value ?? 0
              const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(0) : '0'
              return `${value}: Rp ${amount.toLocaleString('id-ID')} (${percentage}%)`
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Category Breakdown List */}
      <div className="space-y-2">
        <h4 className="text-label font-bold text-white/70">Detail Kategori</h4>
        <div className="space-y-1">
          {chartData.map((item, index) => {
            const percentage = ((item.value / totalSpent) * 100).toFixed(1)
            return (
              <div key={item.name} className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 border-2 border-white/30"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-white text-label">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-mono-sm">
                    Rp {item.value.toLocaleString('id-ID')}
                  </p>
                  <p className="text-white/60 text-label">{percentage}%</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
