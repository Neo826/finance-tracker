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
    const { amount, type, note, date, categoryId } = body

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        type,
        note: note || null,
        date: new Date(date),
        categoryId,
      },
      include: { category: true },
    })

    return Response.json(transaction)
  } catch (error) {
    console.error('Update transaction error:', error)
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

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.transaction.delete({ where: { id } })
  return Response.json({ success: true })
}
