import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return Response.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: 'Email already in use' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        categories: {
          createMany: {
            data: [
              // Income categories
              { name: 'Salary', color: '#22c55e', icon: '💼', type: 'income' },
              { name: 'Freelance', color: '#3b82f6', icon: '💻', type: 'income' },
              { name: 'Other Income', color: '#a855f7', icon: '💰', type: 'income' },
              // Expense categories
              { name: 'Food & Dining', color: '#ef4444', icon: '🍔', type: 'expense' },
              { name: 'Transport', color: '#f97316', icon: '🚗', type: 'expense' },
              { name: 'Shopping', color: '#ec4899', icon: '🛍️', type: 'expense' },
              { name: 'Bills', color: '#64748b', icon: '📄', type: 'expense' },
              { name: 'Entertainment', color: '#8b5cf6', icon: '🎬', type: 'expense' },
              { name: 'Health', color: '#06b6d4', icon: '❤️', type: 'expense' },
              { name: 'Other', color: '#6366f1', icon: '📦', type: 'expense' },
            ],
          },
        },
      },
    })

    return Response.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
