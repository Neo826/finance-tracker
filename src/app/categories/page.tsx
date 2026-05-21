'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import BottomSheet from '@/components/BottomSheet'

interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: string
}

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#64748b', '#6366f1', '#a855f7', '#14b8a6',
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense')
  const [showSheet, setShowSheet] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('💰')
  const [color, setColor] = useState('#6366f1')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setCategories(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  function openAdd() {
    setEditingCategory(null)
    setName('')
    setIcon('💰')
    setColor('#6366f1')
    setType(activeTab)
    setFormError('')
    setShowSheet(true)
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat)
    setName(cat.name)
    setIcon(cat.icon)
    setColor(cat.color)
    setType(cat.type as 'income' | 'expense')
    setFormError('')
    setShowSheet(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Transactions using it may be affected.')) return
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchCategories()
    } else {
      const d = await res.json()
      alert(d.error || 'Failed to delete')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!name) {
      setFormError('Name is required')
      return
    }

    setFormLoading(true)
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon, color, type }),
      })

      if (!res.ok) {
        const d = await res.json()
        setFormError(d.error || 'Failed to save')
      } else {
        setShowSheet(false)
        fetchCategories()
      }
    } finally {
      setFormLoading(false)
    }
  }

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  return (
    <div className="px-4 pt-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-slate-400 text-sm">Manage your categories</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-8">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <Tabs.Root
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'expense' | 'income')}
        >
          <Tabs.List className="flex bg-slate-800 rounded-xl p-1 mb-4 border border-slate-700">
            <Tabs.Trigger
              value="expense"
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=inactive]:text-slate-400"
            >
              Expense ({expenseCategories.length})
            </Tabs.Trigger>
            <Tabs.Trigger
              value="income"
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=inactive]:text-slate-400"
            >
              Income ({incomeCategories.length})
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="expense">
            <CategoryList
              categories={expenseCategories}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </Tabs.Content>

          <Tabs.Content value="income">
            <CategoryList
              categories={incomeCategories}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          </Tabs.Content>
        </Tabs.Root>
      )}

      {/* Add/Edit sheet */}
      <BottomSheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
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
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Category name"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Icon (emoji)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-2xl text-center placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="💰"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-xl transition-all ${
                    color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div
                className="w-9 h-9 rounded-xl flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="#6366f1"
              />
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
              onClick={() => setShowSheet(false)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              {formLoading ? 'Saving…' : editingCategory ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}

function CategoryList({
  categories,
  onEdit,
  onDelete,
}: {
  categories: Category[]
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
}) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🏷️</div>
        <p className="text-slate-400">No categories yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center gap-3 bg-slate-800 rounded-2xl px-4 py-3.5 border border-slate-700"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: cat.color + '30' }}
          >
            {cat.icon}
          </div>
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: cat.color }}
          />
          <span className="flex-1 text-white font-medium">{cat.name}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(cat)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(cat.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
