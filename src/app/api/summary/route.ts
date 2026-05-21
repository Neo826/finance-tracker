import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  const currentMonthStart = new Date(year, month - 1, 1)
  const currentMonthEnd = endOfMonth(currentMonthStart)

  // Current month transactions
  const currentTransactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: currentMonthStart, lte: currentMonthEnd },
    },
    include: { category: true },
  })

  const currentIncome = currentTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)

  const currentExpenses = currentTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  // Category breakdown for current month expenses
  const categoryMap: Record<string, { name: string; color: string; icon: string; total: number }> = {}
  for (const t of currentTransactions) {
    if (t.type === 'expense') {
      if (!categoryMap[t.categoryId]) {
        categoryMap[t.categoryId] = {
          name: t.category.name,
          color: t.category.color,
          icon: t.category.icon,
          total: 0,
        }
      }
      categoryMap[t.categoryId].total += t.amount
    }
  }
  const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.total - a.total)

  // Last 6 months data
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(currentMonthStart, i)
    const start = startOfMonth(d)
    const end = endOfMonth(d)

    const txns = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: { gte: start, lte: end },
      },
    })

    const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    monthlyData.push({
      month: format(d, 'MMM'),
      income,
      expenses,
    })
  }

  return Response.json({
    monthlyData,
    categoryBreakdown,
    currentMonth: {
      income: currentIncome,
      expenses: currentExpenses,
      net: currentIncome - currentExpenses,
    },
  })
}
