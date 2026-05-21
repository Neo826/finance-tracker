'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: string
}

interface Transaction {
  id: string
  amount: number
  type: string
  note: string | null
  date: string
  categoryId: string
  category: Category
}

interface TransactionFormProps {
  initialDate?: Date
  transaction?: Transaction
  onSuccess: () => void
  onCancel: () => void
}

export default function TransactionForm({
  initialDate,
  transaction,
  onSuccess,
  onCancel,
}: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>(
    (transaction?.type as 'income' | 'expense') ?? 'expense'
  )
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [note, setNote] = useState(transaction?.note ?? '')
  const [date, setDate] = useState(
    transaction
      ? format(new Date(transaction.date), 'yyyy-MM-dd')
      : initialDate
      ? format(initialDate, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd')
  )
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        setCategories(data)
        // Auto-select first category of current type if none selected
        if (!categoryId) {
          const first = data.find((c: Category) => c.type === type)
          if (first) setCategoryId(first.id)
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When type changes, reset category to first of that type
  useEffect(() => {
    if (!transaction) {
      const first = categories.find((c) => c.type === type)
      if (first) setCategoryId(first.id)
    }
  }, [type, categories, transaction])

  const filteredCategories = categories.filter((c) => c.type === type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount')
      return
    }
    if (!categoryId) {
      setError('Select a category')
      return
    }

    setLoading(true)
    try {
      const url = transaction ? `/api/transactions/${transaction.id}` : '/api/transactions'
      const method = transaction ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type, note, date, categoryId }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to save')
      } else {
        onSuccess()
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4">
      {/* Type toggle */}
      <div className="flex bg-slate-700 rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-[44px] ${
            type === 'expense'
              ? 'bg-red-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-[44px] ${
            type === 'income'
              ? 'bg-green-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Income
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-semibold">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full bg-slate-700 border border-slate-600 rounded-xl pl-8 pr-4 py-3 text-white text-lg font-semibold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {filteredCategories.map((cat) => (
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

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Add a note…"
        />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-1 pb-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
        >
          {loading ? 'Saving…' : transaction ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  )
}
