import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { improveReport } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await req.json()
    const { content, teamId, reportId } = body

    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: 'Нет текста отчета' }, { status: 400 })
    }

    let resolvedTeamId = teamId
    if (reportId) {
      const report = await db.report.findUnique({
        where: { id: reportId },
        select: { authorId: true, teamId: true },
      })
      if (!report || report.authorId !== userId) {
        return NextResponse.json({ error: 'Нет прав на улучшение отчета' }, { status: 403 })
      }
      resolvedTeamId = report.teamId
    }

    const template = resolvedTeamId
      ? await db.reportTemplate.findFirst({
          where: { teamId: resolvedTeamId, active: true },
          orderBy: { updatedAt: 'desc' },
        })
      : null

    const fields = Array.isArray(template?.fields) ? template.fields.map(String) : []
    const improvedContent = await improveReport(String(content), fields)

    return NextResponse.json({ improvedContent })
  } catch (error) {
    console.error('Improve report error:', error)
    return NextResponse.json({ error: 'Ошибка улучшения отчета' }, { status: 500 })
  }
}
