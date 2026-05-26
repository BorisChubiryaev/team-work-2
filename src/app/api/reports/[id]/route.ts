import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { id } = await params
    const body = await req.json()
    const { status, managerComment, content } = body

    const report = await db.report.findUnique({
      where: { id },
      include: { team: true },
    })

    if (!report) {
      return NextResponse.json({ error: 'Отчет не найден' }, { status: 404 })
    }

    // Author can update content and submit
    // Manager can update status and add comment
    const updateData: Record<string, unknown> = {}

    if (content && report.authorId === userId) {
      updateData.content = content
    }

    if (status) {
      // Manager actions: review, approve, request revision
      if (['reviewed', 'approved', 'revision_needed'].includes(status)) {
        if (report.team.managerId !== userId) {
          return NextResponse.json({ error: 'Нет прав для проверки отчета' }, { status: 403 })
        }
        updateData.status = status
      }
      // Author actions: submit, resubmit
      if (['submitted', 'draft'].includes(status)) {
        if (report.authorId !== userId) {
          return NextResponse.json({ error: 'Нет прав для изменения отчета' }, { status: 403 })
        }
        updateData.status = status
      }
    }

    if (managerComment !== undefined) {
      updateData.managerComment = managerComment
    }

    const updated = await db.report.update({
      where: { id },
      data: updateData,
      include: { author: true, team: true, project: true },
    })

    // Notify author about review
    if (status && ['reviewed', 'approved', 'revision_needed'].includes(status)) {
      const statusText = status === 'approved' ? 'одобрен' : status === 'revision_needed' ? 'требует доработки' : 'рассмотрен'
      await db.notification.create({
        data: {
          title: 'Отчет ' + statusText,
          message: `Ваш еженедельный отчет был ${statusText}`,
          type: 'report_reviewed',
          userId: report.authorId,
          link: 'reports',
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json({ error: 'Ошибка обновления отчета' }, { status: 500 })
  }
}
