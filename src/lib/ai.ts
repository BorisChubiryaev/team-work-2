const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function callAI(messages: AIMessage[]): Promise<string> {
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'TeamFlow',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter API error:', error)
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Не удалось получить ответ от ИИ'
  } catch (error) {
    console.error('AI call failed:', error)
    throw error
  }
}

export async function analyzeReports(reportContents: string[]): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: 'Ты — AI-ассистент для анализа командных отчетов. Анализируй отчеты сотрудников и предоставляй структурированные выводы на русском языке. Формат: 1) Общие достижения 2) Риски и проблемы 3) Рекомендации 4) Тенденции',
    },
    {
      role: 'user',
      content: `Проанализируй следующие еженедельные отчеты команды и дай сводку:\n\n${reportContents.map((c, i) => `Отчет ${i + 1}:\n${c}`).join('\n\n---\n\n')}`,
    },
  ]
  return callAI(messages)
}

export async function improveReport(content: string, templateFields: string[] = []): Promise<string> {
  const templateHint = templateFields.length
    ? `\n\nОжидаемый формат отчета: ${templateFields.join(', ')}.`
    : ''

  const messages: AIMessage[] = [
    {
      role: 'system',
      content: 'Ты — редактор рабочих отчетов. Улучшай ясность, структуру и деловой стиль на русском языке. Сохраняй факты, не выдумывай прогресс, блокеры или даты. Верни только улучшенный текст отчета.',
    },
    {
      role: 'user',
      content: `Улучши этот отчет сотрудника:${templateHint}\n\n${content}`,
    },
  ]
  return callAI(messages)
}

export async function analyzeRetro(items: { category: string; content: string; votes: number }[]): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: 'Ты — AI-фасилитатор ретроспектив. Анализируй элементы ретро и предлагай конкретные действия для улучшения работы команды на русском языке. Формат: 1) Ключевые позитивы 2) Основные проблемы 3) Конкретные действия 4) Рекомендации по командной динамике',
    },
    {
      role: 'user',
      content: `Проанализируй элементы ретроспективы:\n\n${items.map(item => `[${item.category}] ${item.content} (голосов: ${item.votes})`).join('\n')}`,
    },
  ]
  return callAI(messages)
}

export async function generateDeadlineInsight(projects: { name: string; status: string; endDate: string; progress: number }[]): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: 'Ты — AI-ассистент проектного управления. Анализируй проекты и дедлайны, предлагай приоритеты и предупрежай о рисках на русском языке.',
    },
    {
      role: 'user',
      content: `Проанализируй текущие проекты и их дедлайны:\n\n${projects.map(p => `- ${p.name}: статус ${p.status}, дедлайн ${p.endDate}, прогресс ${p.progress}%`).join('\n')}`,
    },
  ]
  return callAI(messages)
}
