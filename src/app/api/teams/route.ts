import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Название команды обязательно' }, { status: 400 })
    }

    const team = await db.team.create({
      data: {
        name,
        description,
        managerId: userId,
        members: {
          create: {
            userId,
            role: 'lead',
          },
        },
      },
      include: {
        manager: true,
        members: { include: { user: true } },
      },
    })

    // Update user role to manager
    await db.user.update({
      where: { id: userId },
      data: { role: 'manager' },
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json({ error: 'Ошибка создания команды' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id

    const teams = await db.team.findMany({
      where: {
        OR: [
          { managerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        manager: true,
        members: { include: { user: true } },
        _count: { select: { members: true, projects: true, reports: true } },
      },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Get teams error:', error)
    return NextResponse.json({ error: 'Ошибка получения команд' }, { status: 500 })
  }
}
