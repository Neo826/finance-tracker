'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import { formatCurrency } from '@/lib/utils'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: string
  monthlyBudget: number | null
}

interface Transaction {
  id: string
  amount: number
  type: string
  categoryId: string
}

interface BudgetRow {
  category: Category
  spent: number
}

function ProgressBar({ spent, budget, color }: { spent: number; budget: number; color: string }) {
  const pct = Math.min((spent / budget) * 100, 100)
  const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f97316' : '#22c55e'

  return (
    <div className="mt-2.5">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{formatCurrency(spent)} spent</span>
        <span className={pct >= 100 ? 'text-red-400 font-semibold' : pct >= 80 ? 'text-orange-400 font-semibold' : 'text-slate-400'}>
          {pct >= 100 ? `${formatCurrency(spent - budget)} over` : `${formatCurrency(budget - spent)} left`}
        </span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="text-right text-xs text-slate-500 mt-1">
        limit: {formatCurrency(budget)}/mo
      </div>
    </div>
  )
}

export default function BudgetsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [budgetInput, setBudgetInput] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const month = currentDate.getMonth() + 1
    const year = currentDate.getFullYear()
    const [catRes, txRes] = await Promise.all([
      fetch('/api/categories'),
      fetch(`/api/transactions?month=${month}&year=${year}`),
    ])
    if (catRes.ok) setCategories(await catRes.json())
    if (txRes.ok) setTransactions(await txRes.json())
    setLoading(false)
  }, [currentDate])

  useEffect(() => { fetchData() }, [fetchData])

  const spendingByCategory: Record<string, number> = {}
  transactions.forEach((t) => {
    if (t.type === 'expense') {
      spendingByCategory[t.categoryId] = (spendingByCategory[t.categoryId] ?? 0) + t.amount
    }
  })

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const withBudget: BudgetRow[] = expenseCategories
    .filter((c) => c.monthlyBudget != null)
    .map((c) => ({ category: c, spent: spendingByCategory[c.id] ?? 0 }))
  const withoutBudget: BudgetRow[] = expenseCategories
    .filter((c) => c.monthlyBudget == null)
    .map((c) => ({ category: c, spent: spendingByCategory[c.id] ?? 0 }))

  function openEdit(cat: Category) {
    setEditingCategory(cat)
    setBudgetInput(cat.monthlyBudget != null ? String(cat.monthlyBudget) : '')
  }

  async function saveBudget() {
    if (!editingCategory) return
    setSaving(true)
    const amount = budgetInput === '' ? null : parseFloat(budgetInput)
    await fetch(`/api/categories/${editingCategory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingCategory.name,
        color: editingCategory.color,
        icon: editingCategory.icon,
        type: editingCategory.type,
        monthlyBudget: amount,
      }),
    })
    setSaving(false)
    setEditingCategory(null)
    fetchData()
  }

  return (
    <div className="px-4 pt-5 pb-4">
      <h1 className="text-2xl font-bold text-white mb-1">Budgets</h1>
      <p className="text-slate-400 text-sm mb-5">Monthly spending limits by category</p>

      {/* Month nav */}
      <div className="flex items-center justify-between bg-slate-800 rounded-2xl px-4 py-3 mb-5 border border-slate-700">
        <button
          onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="p-2 rounded-xl hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-white font-semibold">{format(currentDate, 'MMMM yyyy')}</span>
        <button
          onClick={() => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="p-2 rounded-xl hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-10">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Categories with budgets */}
          {withBudget.map(({ category, spent }) => (
            <button
              key={category.id}
              onClick={() => openEdit(category)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-left active:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: category.color + '30' }}
                >
                  {category.icon}
                </div>
                <span className="flex-1 text-white font-medium">{category.name}</span>
                <span className="text-slate-400 text-xs">tap to edit</span>
              </div>
              <ProgressBar spent={spent} budget={category.monthlyBudget!} color={category.color} />
            </button>
          ))}

          {/* Divider */}
          {withoutBudget.length > 0 && (
            <div className="pt-2">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">
                No budget set
              </p>
              {withoutBudget.map(({ category, spent }) => (
                <button
                  key={category.id}
                  onClick={() => openEdit(category)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-left active:bg-slate-700 transition-colors mb-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: category.color + '30' }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{category.name}</p>
                      {spent > 0 && (
                        <p className="text-slate-400 text-xs mt-0.5">{formatCurrency(spent)} spent this month</p>
                      )}
                    </div>
                    <span className="text-indigo-400 text-xs font-medium">Set limit</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {expenseCategories.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💸</div>
              <p className="text-slate-400">No expense categories yet</p>
            </div>
          )}
        </div>
      )}

      {/* Edit budget sheet */}
      <BottomSheet
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={editingCategory ? `${editingCategory.icon} ${editingCategory.name}` : ''}
      >
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Monthly budget limit
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-8 pr-4 py-3 text-white text-lg font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
                autoFocus
              />
            </div>
            <p className="text-slate-500 text-xs mt-2">Leave empty to remove the budget limit</p>
          </div>

          <div className="flex gap-3 pt-1 pb-4">
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              onClick={saveBudget}
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
