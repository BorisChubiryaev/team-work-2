import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { id: teamId, memberId } = await params
    const body = await req.json()
    const { role } = body

    const team = await db.team.findUnique({
      where: { id: teamId },
    })

    if (!team || team.managerId !== userId) {
      return NextResponse.json({ error: 'Нет прав для управления командой' }, { status: 403 })
    }

    const member = await db.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Ошибка обновления участника' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const { id: teamId, memberId } = await params

    const team = await db.team.findUnique({
      where: { id: teamId },
    })

    if (!team || team.managerId !== userId) {
      return NextResponse.json({ error: 'Нет прав для управления командой' }, { status: 403 })
    }

    await db.teamMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Ошибка удаления участника' }, { status: 500 })
  }
}
