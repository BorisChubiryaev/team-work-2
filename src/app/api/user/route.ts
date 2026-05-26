import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await req.json()
    const { name, position, department, role } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (position !== undefined) updateData.position = position
    if (department !== undefined) updateData.department = department
    if (role !== undefined) updateData.role = role

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Ошибка обновления профиля' }, { status: 500 })
  }
}
