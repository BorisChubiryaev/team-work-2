'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus, MessageSquare, Brain, ThumbsUp, Lightbulb, AlertTriangle, CheckSquare, ChevronLeft, Sparkles,
} from 'lucide-react'

const categoryLabels: Record<string, string> = {
  went_well: 'Что прошло хорошо',
  improve: 'Что улучшить',
  action_items: 'Задачи',
  ideas: 'Идеи',
}

const categoryColors: Record<string, string> = {
  went_well: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20',
  improve: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
  action_items: 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
  ideas: 'border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20',
}

const categoryIcons: Record<string, React.ReactNode> = {
  went_well: <ThumbsUp className="h-4 w-4 text-emerald-600" />,
  improve: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  action_items: <CheckSquare className="h-4 w-4 text-blue-600" />,
  ideas: <Lightbulb className="h-4 w-4 text-purple-600" />,
}

const retroStatusLabels: Record<string, string> = {
  planned: 'Запланирована',
  in_progress: 'В процессе',
  completed: 'Завершена',
}

export function RetroPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedRetroId, setSelectedRetroId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTeamId, setNewTeamId] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('went_well')
  const [newItemContent, setNewItemContent] = useState('')

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: retros, isLoading } = useQuery({
    queryKey: ['retros'],
    queryFn: async () => {
      const res = await fetch('/api/retros')
      if (!res.ok) return []
      return res.json()
    },
  })

  const createRetro = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/retros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retros'] })
      setCreateOpen(false)
      setNewTitle('')
      setNewDesc('')
    },
  })

  const addItem = useMutation({
    mutationFn: async ({ retroId, category, content }: { retroId: string; category: string; content: string }) => {
      const res = await fetch(`/api/retros/${retroId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, content }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retros'] })
      setNewItemContent('')
    },
  })

  const updateRetro = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string }) => {
      const res = await fetch(`/api/retros/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retros'] })
    },
  })

  const analyzeRetro = useMutation({
    mutationFn: async (retroId: string) => {
      const res = await fetch(`/api/retros/${retroId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retros'] })
    },
  })

  const voteItem = useMutation({
    mutationFn: async ({ retroId, itemId, votes }: { retroId: string; itemId: string; votes: number }) => {
      // Since we don't have a dedicated item update endpoint, use the analyze endpoint
      // Actually let's just increment locally - we'd need a PATCH endpoint for items
      // For now, we'll use a workaround
      return Promise.resolve()
    },
  })

  const selectedRetro = retros?.find((r: { id: string }) => r.id === selectedRetroId)

  if (isLoading) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
  }

  // Detail view
  if (selectedRetro) {
    const itemsByCategory: Record<string, typeof selectedRetro.items> = {}
    selectedRetro.items?.forEach((item: { category: string }) => {
      if (!itemsByCategory[item.category]) itemsByCategory[item.category] = []
      itemsByCategory[item.category].push(item)
    })

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedRetroId(null)}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div className="flex gap-2">
            <Select
              value={selectedRetro.status}
              onValueChange={(val) => updateRetro.mutate({ id: selectedRetro.id, status: val })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Запланирована</SelectItem>
                <SelectItem value="in_progress">В процессе</SelectItem>
                <SelectItem value="completed">Завершена</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => analyzeRetro.mutate(selectedRetro.id)}
              disabled={analyzeRetro.isPending}
            >
              <Brain className="h-4 w-4 mr-2" />
              {analyzeRetro.isPending ? 'Анализ...' : 'AI-рекомендации'}
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold">{selectedRetro.title}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(selectedRetro.date).toLocaleDateString('ru-RU')} · {retroStatusLabels[selectedRetro.status] || selectedRetro.status}
          </p>
        </div>

        {/* AI Insights */}
        {(selectedRetro.aiInsights || analyzeRetro.data) && (
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                AI-рекомендации
              </h3>
              <div className="whitespace-pre-wrap text-sm">
                {analyzeRetro.data?.insights || selectedRetro.aiInsights}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Retro Board */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(categoryLabels).map(([category, label]) => (
            <Card key={category} className={`${categoryColors[category]} border`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  {categoryIcons[category]}
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {itemsByCategory[category]?.map((item: { id: string; content: string; votes: number; authorId: string }) => (
                  <div key={item.id} className="bg-white/60 dark:bg-black/20 p-2 rounded-lg text-sm">
                    <p>{item.content}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{item.votes}</span>
                    </div>
                  </div>
                ))}
                <div className="flex gap-1">
                  <Input
                    placeholder="Добавить..."
                    className="h-8 text-xs bg-white/60 dark:bg-black/20"
                    value={newItemCategory === category ? newItemContent : ''}
                    onChange={(e) => { setNewItemCategory(category); setNewItemContent(e.target.value) }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newItemContent.trim()) {
                        addItem.mutate({ retroId: selectedRetro.id, category, content: newItemContent })
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      if (newItemContent.trim() && newItemCategory === category) {
                        addItem.mutate({ retroId: selectedRetro.id, category, content: newItemContent })
                      } else {
                        setNewItemCategory(category)
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ретроспективы</h2>
          <p className="text-sm text-muted-foreground">Обзор прошлых спринтов и улучшения</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Новая ретро
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать ретроспективу</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Название" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <Textarea placeholder="Описание (опционально)" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
              <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              {teams?.length > 1 && (
                <Select value={newTeamId} onValueChange={setNewTeamId}>
                  <SelectTrigger><SelectValue placeholder="Команда" /></SelectTrigger>
                  <SelectContent>
                    {teams.map((t: { id: string; name: string }) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  const teamId = newTeamId || teams?.[0]?.id
                  if (!teamId || !newTitle || !newDate) return
                  createRetro.mutate({ title: newTitle, description: newDesc, date: newDate, teamId })
                }}
                disabled={!newTitle || !newDate || createRetro.isPending}
              >
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {retros?.map((retro: {
          id: string; title: string; description?: string; date: string; status: string; aiInsights?: string;
          participants: { id: string }[]; items: { id: string }[]
        }) => (
          <Card
            key={retro.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedRetroId(retro.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{retro.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(retro.date).toLocaleDateString('ru-RU')} · {retro.participants?.length || 0} участников · {retro.items?.length || 0} элементов
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {retro.aiInsights && (
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      <Sparkles className="h-3 w-3 mr-1" /> AI
                    </Badge>
                  )}
                  <Badge variant="secondary">{retroStatusLabels[retro.status] || retro.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!retros || retros.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Нет ретроспектив</p>
              <p className="text-muted-foreground text-sm">Создайте первую ретроспективу для вашей команды</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
