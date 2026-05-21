import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
  })

  return Response.json(categories)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, color, icon, type } = body

    if (!name || !type) {
      return Response.json({ error: 'Name and type are required' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        color: color || '#6366f1',
        icon: icon || '💰',
        type,
        userId: session.user.id,
      },
    })

    return Response.json(category, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
