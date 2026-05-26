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

    const body = await req.json()
    const { name, description, status, priority, startDate, endDate, teamId, parentId } = body

    if (!name || !teamId) {
      return NextResponse.json({ error: 'Название и команда обязательны' }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        status: status || 'active',
        priority: priority || 'medium',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        teamId,
        parentId: parentId || null,
      },
      include: {
        team: true,
        parent: true,
        milestones: true,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Ошибка создания проекта' }, { status: 500 })
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
      teamIds = [
        ...userTeams.map(t => t.teamId),
        ...managedTeams.map(t => t.id),
      ]
    }

    const projects = await db.project.findMany({
      where: { teamId: { in: teamIds } },
      include: {
        team: true,
        parent: true,
        children: { include: { milestones: true } },
        milestones: { orderBy: { dueDate: 'asc' } },
        _count: { select: { reports: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json({ error: 'Ошибка получения проектов' }, { status: 500 })
  }
}
