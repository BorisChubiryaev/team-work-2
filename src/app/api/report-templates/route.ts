import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

const defaultFields = ['Промежуток времени', 'Проект', 'Что сделано', 'Блокеры', 'Планы']

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    let teamIds = teamId ? [teamId] : []
    if (!teamId) {
      const [memberships, managedTeams] = await Promise.all([
        db.teamMember.findMany({ where: { userId }, select: { teamId: true } }),
        db.team.findMany({ where: { managerId: userId }, select: { id: true } }),
      ])
      teamIds = [...memberships.map(t => t.teamId), ...managedTeams.map(t => t.id)]
    }

    const templates = await db.reportTemplate.findMany({
      where: { teamId: { in: teamIds }, active: true },
      include: { team: true, manager: true },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Get report templates error:', error)
    return NextResponse.json({ error: 'Ошибка получения шаблонов' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await req.json()
    const { teamId, name, fields } = body

    if (!teamId || !name) {
      return NextResponse.json({ error: 'Команда и название обязательны' }, { status: 400 })
    }

    const team = await db.team.findUnique({ where: { id: teamId }, select: { managerId: true } })
    if (!team || team.managerId !== userId) {
      return NextResponse.json({ error: 'Нет прав для шаблона этой команды' }, { status: 403 })
    }

    const normalizedFields = Array.isArray(fields)
      ? fields.map((field: unknown) => String(field).trim()).filter(Boolean)
      : defaultFields

    const template = await db.reportTemplate.create({
      data: {
        teamId,
        managerId: userId,
        name,
        fields: normalizedFields.length > 0 ? normalizedFields : defaultFields,
      },
      include: { team: true, manager: true },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Create report template error:', error)
    return NextResponse.json({ error: 'Ошибка создания шаблона' }, { status: 500 })
  }
}
