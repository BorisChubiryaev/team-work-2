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

    const { id: projectId } = await params
    const body = await req.json()
    const { title, description, dueDate } = body

    if (!title || !dueDate) {
      return NextResponse.json({ error: 'Название и срок обязательны' }, { status: 400 })
    }

    const milestone = await db.milestone.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        projectId,
      },
    })

    return NextResponse.json(milestone)
  } catch (error) {
    console.error('Create milestone error:', error)
    return NextResponse.json({ error: 'Ошибка создания этапа' }, { status: 500 })
  }
}
