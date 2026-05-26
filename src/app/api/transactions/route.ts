import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: start, lte: end },
    },
    include: { category: true },
    orderBy: { date: 'desc' },
  })

  return Response.json(transactions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { amount, type, note, date, categoryId } = body

    if (!amount || !type || !date || !categoryId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        note: note || null,
        date: new Date(`${date}T12:00:00`),
        categoryId,
        userId: session.user.id,
      },
      include: { category: true },
    })

    return Response.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Create transaction error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
