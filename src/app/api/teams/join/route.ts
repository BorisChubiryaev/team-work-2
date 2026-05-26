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
    const { inviteCode } = body

    if (!inviteCode) {
      return NextResponse.json({ error: 'Код приглашения обязателен' }, { status: 400 })
    }

    const team = await db.team.findUnique({
      where: { inviteCode },
      include: { manager: true },
    })

    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

    // Check if already a member
    const existing = await db.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId } },
    })

    if (existing) {
      return NextResponse.json({ error: 'Вы уже участник этой команды' }, { status: 400 })
    }

    const member = await db.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: 'member',
      },
      include: { team: true, user: true },
    })

    // Create notification for manager
    await db.notification.create({
      data: {
        title: 'Новый участник',
        message: `${session.user.name || session.user.email} присоединился к команде "${team.name}"`,
        type: 'team_invite',
        userId: team.managerId,
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Join team error:', error)
    return NextResponse.json({ error: 'Ошибка присоединения к команде' }, { status: 500 })
  }
}
