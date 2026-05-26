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
    const { id: retroId } = await params
    const body = await req.json()
    const { category, content } = body

    if (!category || !content) {
      return NextResponse.json({ error: 'Категория и содержание обязательны' }, { status: 400 })
    }

    // Ensure user is participant
    const existing = await db.retroParticipant.findUnique({
      where: { retroId_userId: { retroId, userId } },
    })

    if (!existing) {
      await db.retroParticipant.create({
        data: { retroId, userId, role: 'participant' },
      })
    }

    const item = await db.retroItem.create({
      data: {
        category,
        content,
        retroId,
        authorId: userId,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Create retro item error:', error)
    return NextResponse.json({ error: 'Ошибка добавления элемента' }, { status: 500 })
  }
}
