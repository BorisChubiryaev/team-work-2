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

    if (!teamId) {
      return NextResponse.json({ error: 'Укажите teamId' }, { status: 400 })
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

    return NextResponse.json({ summary, reportCount: reports.length })
  } catch (error) {
    console.error('AI analyze reports error:', error)
    return NextResponse.json({ error: 'Ошибка AI-анализа' }, { status: 500 })
  }
}
