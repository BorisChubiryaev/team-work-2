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
    const { weekStart, weekEnd, content, teamId, projectId, status } = body

    if (!content || !teamId) {
      return NextResponse.json({ error: 'Содержание и команда обязательны' }, { status: 400 })
    }

    const report = await db.report.create({
      data: {
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        content,
        status: status || 'submitted',
        authorId: userId,
        teamId,
        projectId: projectId || null,
      },
      include: {
        author: true,
        team: true,
        project: true,
      },
    })

    // Notify team manager
    const team = await db.team.findUnique({ where: { id: teamId } })
    if (team && team.managerId !== userId) {
      await db.notification.create({
        data: {
          title: 'Новый отчет',
          message: `${session.user.name || 'Сотрудник'} отправил еженедельный отчет`,
          type: 'report_submitted',
          userId: team.managerId,
          link: 'reports',
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Ошибка создания отчета' }, { status: 500 })
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
    const authorId = searchParams.get('authorId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}

    if (teamId) where.teamId = teamId
    if (status) where.status = status

    // If authorId is 'me', use current user
    if (authorId === 'me') {
      where.authorId = userId
    } else if (authorId) {
      where.authorId = authorId
    }

    // If no specific team, get all teams user belongs to
    if (!teamId) {
      const [userTeams, managedTeams] = await Promise.all([
        db.teamMember.findMany({
          where: { userId },
          select: { teamId: true },
        }),
        db.team.findMany({
          where: { managerId: userId },
          select: { id: true },
        }),
      ])
      const teamIds = [
        ...userTeams.map(t => t.teamId),
        ...managedTeams.map(t => t.id),
      ]
      where.teamId = { in: teamIds }
    }

    const reports = await db.report.findMany({
      where,
      include: {
        author: true,
        team: true,
        project: true,
        comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json({ error: 'Ошибка получения отчетов' }, { status: 500 })
  }
}
