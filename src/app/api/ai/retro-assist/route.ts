import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { analyzeRetro } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { retroId } = body

    if (!retroId) {
      return NextResponse.json({ error: 'Укажите retroId' }, { status: 400 })
    }

    const retro = await db.retro.findUnique({
      where: { id: retroId },
      include: { items: true },
    })

    if (!retro) {
      return NextResponse.json({ error: 'Ретроспектива не найдена' }, { status: 404 })
    }

    if (retro.items.length === 0) {
      return NextResponse.json({ insights: 'Нет элементов для анализа. Добавьте элементы в ретроспективу.' })
    }

    const items = retro.items.map(item => ({
      category: item.category,
      content: item.content,
      votes: item.votes,
    }))

    const insights = await analyzeRetro(items)

    // Save insights
    await db.retro.update({
      where: { id: retroId },
      data: { aiInsights: insights },
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('AI retro assist error:', error)
    return NextResponse.json({ error: 'Ошибка AI-ассистента ретро' }, { status: 500 })
  }
}
