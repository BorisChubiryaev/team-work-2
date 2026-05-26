'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import {
  Plus,
  FileText,
  Send,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Brain,
  ChevronLeft,
  Filter,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Отправлен',
  reviewed: 'Рассмотрен',
  approved: 'Одобрен',
  revision_needed: 'Доработка',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  revision_needed: 'bg-red-100 text-red-700',
}

export function ReportsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { selectedReportId, setSelectedReportId } = useAppStore()

  const userRole = (session?.user as { role?: string })?.role || 'employee'
  const isManager = userRole === 'manager'

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [newReportOpen, setNewReportOpen] = useState(false)
  const [reportContent, setReportContent] = useState('')
  const [selectedTeamId, setSelectedTeamIdLocal] = useState('')
  const [selectedProjectId, setSelectedProjectIdLocal] = useState('')
  const [commentText, setCommentText] = useState('')

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (!isManager) params.set('authorId', 'me')
      if (filterStatus !== 'all') params.set('status', filterStatus)
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) return []
      return res.json()
    },
  })

  const createReport = useMutation({
    mutationFn: async (data: { content: string; teamId: string; projectId?: string; weekStart: string; weekEnd: string }) => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: 'submitted' }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setNewReportOpen(false)
      setReportContent('')
    },
  })

  const updateReport = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; managerComment?: string }) => {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })

  const addComment = useMutation({
    mutationFn: async ({ reportId, content }: { reportId: string; content: string }) => {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setCommentText('')
    },
  })

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const teamId = teams?.[0]?.id
      if (!teamId) throw new Error('Нет команды')
      const res = await fetch('/api/reports/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      return res.json()
    },
  })

  const selectedReport = reports?.find((r: { id: string }) => r.id === selectedReportId)
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    )
  }

  // Report detail view
  if (selectedReport) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => setSelectedReportId(null)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад к списку
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Отчет за {new Date(selectedReport.weekStart).toLocaleDateString('ru-RU')} — {new Date(selectedReport.weekEnd).toLocaleDateString('ru-RU')}
              </CardTitle>
              <Badge className={statusColors[selectedReport.status] || ''} variant="secondary">
                {statusLabels[selectedReport.status] || selectedReport.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Автор: {selectedReport.author?.name || 'Неизвестный'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
              {selectedReport.content}
            </div>

            {selectedReport.managerComment && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Комментарий руководителя:</p>
                <p className="text-sm">{selectedReport.managerComment}</p>
              </div>
            )}

            {selectedReport.aiSummary && (
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-2">
                  <Brain className="h-4 w-4" /> AI-саммари:
                </p>
                <p className="text-sm whitespace-pre-wrap">{selectedReport.aiSummary}</p>
              </div>
            )}

            {/* Manager actions */}
            {isManager && selectedReport.status === 'submitted' && (
              <div className="flex gap-2 pt-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => updateReport.mutate({ id: selectedReport.id, status: 'approved' })}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Одобрить
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const comment = prompt('Комментарий к доработке:')
                    if (comment) updateReport.mutate({ id: selectedReport.id, status: 'revision_needed', managerComment: comment })
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Запросить доработку
                </Button>
              </div>
            )}

            {/* Employee resubmit */}
            {!isManager && selectedReport.status === 'revision_needed' && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => updateReport.mutate({ id: selectedReport.id, status: 'submitted' })}
              >
                <Send className="h-4 w-4 mr-2" />
                Переслать
              </Button>
            )}

            <Separator />

            {/* Comments */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Комментарии
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
                {selectedReport.comments?.map((c: { id: string; content: string; author?: { name?: string | null }; createdAt: string }) => (
                  <div key={c.id} className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{c.author?.name || 'Аноним'}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    <p className="text-sm">{c.content}</p>
                  </div>
                ))}
                {(!selectedReport.comments || selectedReport.comments.length === 0) && (
                  <p className="text-sm text-muted-foreground">Нет комментариев</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Написать комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commentText.trim()) {
                      addComment.mutate({ reportId: selectedReport.id, content: commentText })
                    }
                  }}
                />
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                  onClick={() => addComment.mutate({ reportId: selectedReport.id, content: commentText })}
                  disabled={!commentText.trim() || addComment.isPending}
                >
                  Отправить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Отчеты</h2>
          <p className="text-sm text-muted-foreground">
            {isManager ? 'Управление отчетами команды' : 'Ваши еженедельные отчеты'}
          </p>
        </div>
        <div className="flex gap-2">
          {isManager && (
            <Button
              variant="outline"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
            >
              <Brain className="h-4 w-4 mr-2" />
              {analyzeMutation.isPending ? 'Анализ...' : 'AI Анализ'}
            </Button>
          )}
          <Dialog open={newReportOpen} onOpenChange={setNewReportOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Написать отчет
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Новый еженедельный отчет</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">
                    Неделя: {format(weekStart, 'd MMM', { locale: ru })} — {format(weekEnd, 'd MMM yyyy', { locale: ru })}
                  </p>
                </div>
                {teams?.length > 1 && (
                  <Select value={selectedTeamId} onValueChange={setSelectedTeamIdLocal}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите команду" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((t: { id: string; name: string }) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={selectedProjectId} onValueChange={setSelectedProjectIdLocal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите проект (опционально)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без проекта</SelectItem>
                    {projects?.map((p: { id: string; name: string }) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Опишите вашу работу за неделю: что сделано, что в процессе, какие проблемы..."
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  rows={8}
                />
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    const teamId = selectedTeamId || teams?.[0]?.id
                    if (!teamId || !reportContent.trim()) return
                    createReport.mutate({
                      content: reportContent,
                      teamId,
                      projectId: selectedProjectId === 'none' ? undefined : selectedProjectId || undefined,
                      weekStart: weekStart.toISOString(),
                      weekEnd: weekEnd.toISOString(),
                    })
                  }}
                  disabled={!reportContent.trim() || createReport.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Отправить отчет
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Analysis result */}
      {analyzeMutation.data && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-600" />
              Результат AI-анализа ({analyzeMutation.data.reportCount} отчетов)
            </h3>
            <div className="whitespace-pre-wrap text-sm">{analyzeMutation.data.summary}</div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {['all', 'submitted', 'approved', 'revision_needed'].map(status => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            className={filterStatus === status ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' ? 'Все' : statusLabels[status] || status}
          </Button>
        ))}
      </div>

      {/* Reports list */}
      <div className="space-y-3">
        {reports?.map((report: {
          id: string; status: string; content: string; weekStart: string; weekEnd: string;
          author?: { name?: string | null }; project?: { name: string }; managerComment?: string | null;
        }) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedReportId(report.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                    {isManager && report.author?.name && (
                      <span className="text-sm font-medium">{report.author.name}</span>
                    )}
                    {report.project?.name && (
                      <Badge variant="outline" className="text-xs">{report.project.name}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{report.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(report.weekStart).toLocaleDateString('ru-RU')} — {new Date(report.weekEnd).toLocaleDateString('ru-RU')}
                  </p>
                  {report.managerComment && (
                    <p className="text-xs text-emerald-600 mt-1">💬 {report.managerComment.substring(0, 60)}...</p>
                  )}
                </div>
                <Badge className={statusColors[report.status] || ''} variant="secondary">
                  {statusLabels[report.status] || report.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!reports || reports.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Нет отчетов</p>
              <p className="text-muted-foreground text-sm">Создайте первый еженедельный отчет</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
