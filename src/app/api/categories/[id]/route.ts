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
    const { name, color, icon, type, monthlyBudget } = body

    const existing = await prisma.category.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        color,
        icon,
        type,
        monthlyBudget: monthlyBudget != null ? parseFloat(monthlyBudget) : null,
      },
    })

    return Response.json(category)
  } catch (error) {
    console.error('Update category error:', error)
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

  const existing = await prisma.category.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.category.delete({ where: { id } })
  return Response.json({ success: true })
}
