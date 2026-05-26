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
    const { teamId, reportIds } = body
    const userId = (session.user as { id: string }).id

    let reports
    if (reportIds && reportIds.length > 0) {
      reports = await db.report.findMany({
        where: { id: { in: reportIds }, team: { managerId: userId } },
        include: { author: true },
      })
    } else if (teamId) {
      const team = await db.team.findUnique({ where: { id: teamId }, select: { managerId: true } })
      if (!team || team.managerId !== userId) {
        return NextResponse.json({ error: 'Нет прав для анализа отчетов команды' }, { status: 403 })
      }
      reports = await db.report.findMany({
        where: { teamId, status: 'submitted' },
        include: { author: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    } else {
      return NextResponse.json({ error: 'Укажите teamId или reportIds' }, { status: 400 })
    }

    if (reports.length === 0) {
      return NextResponse.json({ summary: 'Нет отчетов для анализа' })
    }

    const reportContents = reports.map(
      r => `Автор: ${r.author.name || r.author.email}\nПериод: ${r.weekStart.toLocaleDateString()} - ${r.weekEnd.toLocaleDateString()}\nСодержание: ${r.content}`
    )

    const summary = await analyzeReports(reportContents)

    const savedSummary = await db.reportSummary.create({
      data: {
        summary,
        reportCount: reports.length,
        teamId: reports[0].teamId,
        managerId: userId,
        filters: { reportIds: reports.map(r => r.id) },
      },
    })

    return NextResponse.json({ summary, reportCount: reports.length, savedSummary })
  } catch (error) {
    console.error('Analyze reports error:', error)
    return NextResponse.json({ error: 'Ошибка AI-анализа отчетов' }, { status: 500 })
  }
}
