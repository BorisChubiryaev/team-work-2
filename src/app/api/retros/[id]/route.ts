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

    const { id } = await params
    const body = await req.json()
    const { status, title, description } = body

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description

    const retro = await db.retro.update({
      where: { id },
      data: updateData,
      include: { team: true, participants: { include: { user: true } }, items: true },
    })

    return NextResponse.json(retro)
  } catch (error) {
    console.error('Update retro error:', error)
    return NextResponse.json({ error: 'Ошибка обновления ретроспективы' }, { status: 500 })
  }
}
