import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const recurring = await prisma.recurringExpense.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: { dayOfMonth: 'asc' },
  })

  return Response.json(recurring)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, amount, dayOfMonth, categoryId } = body

    if (!name || !amount || !dayOfMonth || !categoryId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const recurring = await prisma.recurringExpense.create({
      data: {
        name,
        amount: parseFloat(amount),
        dayOfMonth: parseInt(dayOfMonth),
        categoryId,
        userId: session.user.id,
      },
      include: { category: true },
    })

    return Response.json(recurring, { status: 201 })
  } catch (error) {
    console.error('Create recurring error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
