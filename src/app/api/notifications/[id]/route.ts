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
    const { read } = body

    const notification = await db.notification.update({
      where: { id },
      data: { read: read !== undefined ? read : true },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json({ error: 'Ошибка обновления уведомления' }, { status: 500 })
  }
}
