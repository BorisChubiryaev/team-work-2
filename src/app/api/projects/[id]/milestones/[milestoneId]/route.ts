import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { milestoneId } = await params
    const body = await req.json()
    const { completed, title, description, dueDate } = body

    const updateData: Record<string, unknown> = {}
    if (completed !== undefined) updateData.completed = completed
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)

    const milestone = await db.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    })

    return NextResponse.json(milestone)
  } catch (error) {
    console.error('Update milestone error:', error)
    return NextResponse.json({ error: 'Ошибка обновления этапа' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { milestoneId } = await params

    await db.milestone.delete({
      where: { id: milestoneId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete milestone error:', error)
    return NextResponse.json({ error: 'Ошибка удаления этапа' }, { status: 500 })
  }
}
