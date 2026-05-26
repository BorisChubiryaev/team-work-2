import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { id: reportId } = await params
    const body = await req.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Комментарий не может быть пустым' }, { status: 400 })
    }

    const comment = await db.comment.create({
      data: {
        content,
        authorId: userId,
        reportId,
      },
      include: { author: true },
    })

    // Notify report author
    const report = await db.report.findUnique({ where: { id: reportId } })
    if (report && report.authorId !== userId) {
      await db.notification.create({
        data: {
          title: 'Новый комментарий',
          message: `Комментарий к вашему отчету: ${content.substring(0, 50)}...`,
          type: 'report_reviewed',
          userId: report.authorId,
          link: 'reports',
        },
      })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'Ошибка создания комментария' }, { status: 500 })
  }
}
