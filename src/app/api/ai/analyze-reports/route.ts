import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { analyzeReports } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { teamId } = body
    const userId = (session.user as { id: string }).id

    if (!teamId) {
      return NextResponse.json({ error: 'Укажите teamId' }, { status: 400 })
    }

    const team = await db.team.findUnique({ where: { id: teamId }, select: { managerId: true } })
    if (!team || team.managerId !== userId) {
      return NextResponse.json({ error: 'Нет прав для анализа отчетов команды' }, { status: 403 })
    }

    const reports = await db.report.findMany({
      where: { teamId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    if (reports.length === 0) {
      return NextResponse.json({ summary: 'Нет отчетов для анализа' })
    }

    const reportContents = reports.map(
      r => `Автор: ${r.author.name || r.author.email}\nПериод: ${new Date(r.weekStart).toLocaleDateString('ru-RU')} - ${new Date(r.weekEnd).toLocaleDateString('ru-RU')}\nСтатус: ${r.status}\nСодержание: ${r.content}`
    )

    const summary = await analyzeReports(reportContents)
    const savedSummary = await db.reportSummary.create({
      data: {
        summary,
        reportCount: reports.length,
        teamId,
        managerId: userId,
        filters: { source: 'dashboard' },
      },
    })

    return NextResponse.json({ summary, reportCount: reports.length, savedSummary })
  } catch (error) {
    console.error('AI analyze reports error:', error)
    return NextResponse.json({ error: 'Ошибка AI-анализа' }, { status: 500 })
  }
}
