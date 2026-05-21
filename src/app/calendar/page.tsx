'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react'
import BottomSheet from '@/components/BottomSheet'
import TransactionForm from '@/components/TransactionForm'
import { formatCurrency } from '@/lib/utils'

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

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showDaySheet, setShowDaySheet] = useState(false)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const month = currentDate.getMonth() + 1
      const year = currentDate.getFullYear()
      const res = await fetch(`/api/transactions?month=${month}&year=${year}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data)
      }
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  const getDayTransactions = (day: Date) =>
    transactions.filter((t) => isSameDay(new Date(t.date), day))

  function handleDayClick(day: Date) {
    setSelectedDay(day)
    setShowDaySheet(true)
  }

  function handleAddClick() {
    setEditingTransaction(null)
    setShowAddSheet(true)
  }

  function handleEditClick(t: Transaction) {
    setEditingTransaction(t)
    setShowAddSheet(true)
    setShowDaySheet(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchTransactions()
    }
  }

  const selectedDayTransactions = selectedDay ? getDayTransactions(selectedDay) : []

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white mb-5">Calendar</h1>

      {/* Month nav */}
      <div className="flex items-center justify-between bg-slate-800 rounded-2xl px-4 py-3 mb-4 border border-slate-700">
        <button
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          className="p-2 rounded-xl hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-white font-semibold">{format(currentDate, 'MMMM yyyy')}</span>
        <button
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          className="p-2 rounded-xl hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-slate-700">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center py-2 text-xs font-medium text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Padding for start of month */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[52px] border-b border-r border-slate-700/50" />
          ))}

          {days.map((day, i) => {
            const dayTxns = getDayTransactions(day)
            const hasIncome = dayTxns.some((t) => t.type === 'income')
            const hasExpense = dayTxns.some((t) => t.type === 'expense')
            const isToday = isSameDay(day, new Date())
            const col = (startPad + i) % 7
            const isLastRow =
              Math.floor((startPad + i) / 7) === Math.floor((startPad + days.length - 1) / 7)

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={`min-h-[52px] p-1.5 flex flex-col items-center transition-colors hover:bg-slate-700/50 active:bg-slate-700 ${
                  !isLastRow ? 'border-b border-slate-700/50' : ''
                } ${col !== 6 ? 'border-r border-slate-700/50' : ''}`}
              >
                <span
                  className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-indigo-500 text-white' : 'text-slate-300'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {/* Transaction dots */}
                <div className="flex gap-0.5 mt-0.5">
                  {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                  {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center mt-6">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Day detail sheet */}
      <BottomSheet
        open={showDaySheet}
        onClose={() => setShowDaySheet(false)}
        title={selectedDay ? format(selectedDay, 'EEEE, MMMM d') : ''}
      >
        <div className="px-5 pb-2">
          <button
            onClick={handleAddClick}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px] mb-4"
          >
            <Plus size={18} />
            Add Transaction
          </button>

          {selectedDayTransactions.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">No transactions this day</p>
          ) : (
            <div className="space-y-2 pb-4">
              {selectedDayTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 bg-slate-700 rounded-xl px-4 py-3"
                >
                  <span className="text-2xl leading-none">{t.category.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{t.category.name}</p>
                    {t.note && (
                      <p className="text-slate-400 text-xs truncate">{t.note}</p>
                    )}
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      t.type === 'income' ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditClick(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-600 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Add/Edit transaction sheet */}
      <BottomSheet
        open={showAddSheet}
        onClose={() => {
          setShowAddSheet(false)
          setEditingTransaction(null)
        }}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          initialDate={selectedDay ?? undefined}
          transaction={editingTransaction ?? undefined}
          onSuccess={() => {
            setShowAddSheet(false)
            setEditingTransaction(null)
            fetchTransactions()
            if (selectedDay) setShowDaySheet(true)
          }}
          onCancel={() => {
            setShowAddSheet(false)
            setEditingTransaction(null)
            if (selectedDay) setShowDaySheet(true)
          }}
        />
      </BottomSheet>
    </div>
  )
}
