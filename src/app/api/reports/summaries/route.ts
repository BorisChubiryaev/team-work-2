import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
      const managedTeams = await db.team.findMany({
        where: { managerId: userId },
        select: { id: true },
      })
      teamIds = managedTeams.map(team => team.id)
    }

    const summaries = await db.reportSummary.findMany({
      where: { teamId: { in: teamIds }, managerId: userId },
      include: { team: true, manager: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    return NextResponse.json(summaries)
  } catch (error) {
    console.error('Get report summaries error:', error)
    return NextResponse.json({ error: 'Ошибка получения саммари' }, { status: 500 })
  }
}
