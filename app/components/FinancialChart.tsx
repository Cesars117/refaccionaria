'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area } from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface Entry {
  type: string
  amount: number
  isPaid: boolean
  date: string | Date
}

export default function FinancialChart({ data }: { data: Entry[] }) {
  // Group by fortnight
  const grouped = data.reduce((acc: any, entry) => {
    if (!entry.isPaid) return acc // Only paid for the trend chart
    
    const date = new Date(entry.date)
    if (isNaN(date.getTime())) return acc

    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Get week number of the year
    const firstDayOfYear = new Date(year, 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
    
    const key = `${year}-W${week}`
    const monthName = new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date)
    const label = `${monthName} S${week}`
    
    if (!acc[key]) {
      acc[key] = { key, label, balance: 0, income: 0, expense: 0, sortKey: year * 100 + week }
    }
    
    if (entry.type === 'INCOME') {
      acc[key].income += entry.amount
      acc[key].balance += entry.amount
    } else {
      acc[key].expense += entry.amount
      acc[key].balance -= entry.amount
    }
    
    return acc
  }, {})

  const chartData = Object.values(grouped).sort((a: any, b: any) => a.sortKey - b.sortKey)

  if (chartData.length === 0) {
    return <div className="p-8 text-center text-gray-400">Sin datos suficientes para graficar</div>
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(val) => `$${val/1000}k`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value: number) => [formatCurrency(value), 'Balance Neto']}
          />
          <Area 
            type="monotone" 
            dataKey="balance" 
            stroke="#2563eb" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorBalance)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
