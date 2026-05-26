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
    const { title, description, date, teamId } = body

    if (!title || !teamId) {
      return NextResponse.json({ error: 'Название и команда обязательны' }, { status: 400 })
    }

    const retro = await db.retro.create({
      data: {
        title,
        description,
        date: new Date(date),
        teamId,
        participants: {
          create: {
            userId,
            role: 'facilitator',
          },
        },
      },
      include: {
        team: true,
        participants: { include: { user: true } },
      },
    })

    // Notify team members
    const members = await db.teamMember.findMany({
      where: { teamId },
    })
    for (const member of members) {
      if (member.userId !== userId) {
        await db.notification.create({
          data: {
            title: 'Новая ретроспектива',
            message: `Запланирована ретроспектива "${title}"`,
            type: 'retro',
            userId: member.userId,
            link: 'retro',
          },
        })
      }
    }

    return NextResponse.json(retro)
  } catch (error) {
    console.error('Create retro error:', error)
    return NextResponse.json({ error: 'Ошибка создания ретроспективы' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    let teamIds: string[] = []
    if (teamId) {
      teamIds = [teamId]
    } else {
      const userTeams = await db.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      })
      const managedTeams = await db.team.findMany({
        where: { managerId: userId },
        select: { id: true },
      })
      teamIds = [
        ...userTeams.map(t => t.teamId),
        ...managedTeams.map(t => t.id),
      ]
    }

    const retros = await db.retro.findMany({
      where: { teamId: { in: teamIds } },
      include: {
        team: true,
        participants: { include: { user: true } },
        items: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(retros)
  } catch (error) {
    console.error('Get retros error:', error)
    return NextResponse.json({ error: 'Ошибка получения ретроспектив' }, { status: 500 })
  }
}
