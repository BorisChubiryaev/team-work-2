import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { analyzeRetro } from '@/lib/ai'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params

    const retro = await db.retro.findUnique({
      where: { id },
      include: { items: true },
    })

    if (!retro) {
      return NextResponse.json({ error: 'Ретроспектива не найдена' }, { status: 404 })
    }

    if (retro.items.length === 0) {
      return NextResponse.json({ insights: 'Нет элементов для анализа' })
    }

    const items = retro.items.map(item => ({
      category: item.category,
      content: item.content,
      votes: item.votes,
    }))

    const insights = await analyzeRetro(items)

    // Save insights
    await db.retro.update({
      where: { id },
      data: { aiInsights: insights },
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Analyze retro error:', error)
    return NextResponse.json({ error: 'Ошибка AI-анализа ретро' }, { status: 500 })
  }
}
