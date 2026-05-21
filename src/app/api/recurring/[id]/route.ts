import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const { name, amount, dayOfMonth, categoryId, active } = body

    const existing = await prisma.recurringExpense.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const recurring = await prisma.recurringExpense.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(dayOfMonth !== undefined && { dayOfMonth: parseInt(dayOfMonth) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(active !== undefined && { active }),
      },
      include: { category: true },
    })

    return Response.json(recurring)
  } catch (error) {
    console.error('Update recurring error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.recurringExpense.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.recurringExpense.delete({ where: { id } })
  return Response.json({ success: true })
}
