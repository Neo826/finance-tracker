'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface CategoryBreakdown {
  name: string
  color: string
  icon: string
  total: number
}

interface MonthlyData {
  month: string
  income: number
  expenses: number
}

interface Summary {
  monthlyData: MonthlyData[]
  categoryBreakdown: CategoryBreakdown[]
  currentMonth: {
    income: number
    expenses: number
    net: number
  }
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    try {
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      const res = await fetch(`/api/summary?month=${month}&year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data)
      }
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm">Your financial overview</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between bg-slate-800 rounded-2xl px-4 py-3 mb-5 border border-slate-700">
        <button
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          className="p-2 rounded-xl hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-white font-semibold text-base">
          {format(currentDate, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          className="p-2 rounded-xl hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : summary ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={14} className="text-green-400" />
                <span className="text-xs text-slate-400 font-medium">Income</span>
              </div>
              <p className="text-green-400 font-bold text-sm">
                {formatCurrency(summary.currentMonth.income)}
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown size={14} className="text-red-400" />
                <span className="text-xs text-slate-400 font-medium">Expenses</span>
              </div>
              <p className="text-red-400 font-bold text-sm">
                {formatCurrency(summary.currentMonth.expenses)}
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex items-center gap-1.5 mb-2">
                <Wallet size={14} className="text-indigo-400" />
                <span className="text-xs text-slate-400 font-medium">Net</span>
              </div>
              <p
                className={`font-bold text-sm ${
                  summary.currentMonth.net >= 0 ? 'text-indigo-400' : 'text-red-400'
                }`}
              >
                {formatCurrency(summary.currentMonth.net)}
              </p>
            </div>
          </div>

          {/* Pie chart: spending by category */}
          {summary.categoryBreakdown.length > 0 && (
            <div className="bg-slate-800 rounded-2xl p-5 mb-5 border border-slate-700">
              <h2 className="text-base font-semibold text-white mb-4">Spending by Category</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={summary.categoryBreakdown}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={45}
                  >
                    {summary.categoryBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: '#f1f5f9',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="mt-3 space-y-2">
                {summary.categoryBreakdown.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm text-slate-300">
                        {cat.icon} {cat.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bar chart: income vs expenses last 6 months */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="text-base font-semibold text-white mb-4">Last 6 Months</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#94a3b8', fontSize: 12 }}
                />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}
    </div>
  )
}
