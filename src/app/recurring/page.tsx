'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import { formatCurrency } from '@/lib/utils'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: string
}

interface RecurringExpense {
  id: string
  name: string
  amount: number
  dayOfMonth: number
  categoryId: string
  category: Category
  active: boolean
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringExpense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [recurRes, catRes] = await Promise.all([
        fetch('/api/recurring'),
        fetch('/api/categories'),
      ])
      if (recurRes.ok) setItems(await recurRes.json())
      if (catRes.ok) {
        const cats = await catRes.json()
        setCategories(cats)
        const firstExpense = cats.find((c: Category) => c.type === 'expense')
        if (firstExpense) setCategoryId(firstExpense.id)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleToggle(item: RecurringExpense) {
    const res = await fetch(`/api/recurring/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !item.active }),
    })
    if (res.ok) fetchData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this recurring expense?')) return
    const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' })
    if (res.ok) fetchData()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!name || !amount || !categoryId || !dayOfMonth) {
      setFormError('All fields are required')
      return
    }
    const day = parseInt(dayOfMonth)
    if (day < 1 || day > 31) {
      setFormError('Day must be between 1 and 31')
      return
    }

    setFormLoading(true)
    try {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, amount, categoryId, dayOfMonth: day }),
      })
      if (!res.ok) {
        const d = await res.json()
        setFormError(d.error || 'Failed to create')
      } else {
        setShowAdd(false)
        setName('')
        setAmount('')
        setDayOfMonth('1')
        fetchData()
      }
    } finally {
      setFormLoading(false)
    }
  }

  const activeTotal = items
    .filter((i) => i.active)
    .reduce((s, i) => s + i.amount, 0)

  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Recurring</h1>
          <p className="text-slate-400 text-sm">Monthly expenses</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {/* Monthly total */}
      <div className="bg-slate-800 rounded-2xl p-5 mb-5 border border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
            <RefreshCw size={22} className="text-red-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Monthly recurring total</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(activeTotal)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-8">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-slate-400">No recurring expenses yet</p>
          <p className="text-slate-500 text-sm mt-1">Add bills and subscriptions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-800 rounded-2xl p-4 border transition-all ${
                item.active ? 'border-slate-700' : 'border-slate-700/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">{item.category.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{item.name}</p>
                  <p className="text-slate-400 text-xs">
                    {item.category.name} &bull; Charged on the {ordinal(item.dayOfMonth)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">{formatCurrency(item.amount)}</p>
                  <p className="text-slate-500 text-xs">per month</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(item)}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors min-h-[36px] ${
                    item.active
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${
                      item.active ? 'bg-green-400' : 'bg-slate-500'
                    }`}
                  />
                  {item.active ? 'Active' : 'Inactive'}
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add recurring sheet */}
      <BottomSheet
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Recurring Expense"
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g. Netflix, Rent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Day of Month
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {expenseCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all min-h-[44px] text-left ${
                    categoryId === cat.id
                      ? 'border-indigo-500 bg-indigo-500/20 text-white'
                      : 'border-slate-600 bg-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="text-lg leading-none">{cat.icon}</span>
                  <span className="text-sm font-medium truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-1 pb-4">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              {formLoading ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}
