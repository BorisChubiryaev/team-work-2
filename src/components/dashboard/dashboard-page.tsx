'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import {
  Users,
  FileText,
  FolderKanban,
  Clock,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export function DashboardPage() {
  const { data: session } = useSession()
  const { setCurrentPage, setSelectedTeamId } = useAppStore()
  const queryClient = useQueryClient()

  const userRole = (session?.user as { role?: string })?.role || 'employee'

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) return []
      return res.json()
    },
  })

  const analyzeMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const res = await fetch('/api/ai/analyze-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })

  if (teamsLoading || reportsLoading || projectsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  const currentTeam = teams?.[0]
  const teamId = currentTeam?.id

  const isManager = userRole === 'manager' || (currentTeam?.managerId === (session?.user as { id?: string })?.id)

  // Manager stats
  const totalMembers = currentTeam?._count?.members || 0
  const pendingReports = reports?.filter((r: { status: string }) => r.status === 'submitted').length || 0
  const activeProjects = projects?.filter((p: { status: string }) => p.status === 'active').length || 0
  const upcomingDeadlines = projects?.filter((p: { endDate: string | null }) => {
    if (!p.endDate) return false
    const end = new Date(p.endDate)
    const now = new Date()
    const diff = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff > 0 && diff <= 14
  }).length || 0

  // Employee stats
  const myReports = reports?.filter((r: { authorId: string }) => r.authorId === (session?.user as { id?: string })?.id) || []
  const myLatestReport = myReports[0]
  const myRevisionReports = myReports.filter((r: { status: string }) => r.status === 'revision_needed')

  // Chart data
  const weeklyReportCounts: Record<string, number> = {}
  reports?.forEach((r: { weekStart: string }) => {
    const week = new Date(r.weekStart).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    weeklyReportCounts[week] = (weeklyReportCounts[week] || 0) + 1
  })
  const barChartData = Object.entries(weeklyReportCounts).slice(-8).map(([name, count]) => ({ name, count }))

  const projectStatusCounts: Record<string, number> = {}
  projects?.forEach((p: { status: string }) => {
    projectStatusCounts[p.status] = (projectStatusCounts[p.status] || 0) + 1
  })
  const pieData = Object.entries(projectStatusCounts).map(([name, value]) => ({ name, value }))
  const PIE_COLORS = ['#10b981', '#f59e0b', '#6b7280', '#ef4444']

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

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  }

  if (!currentTeam) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Добро пожаловать в TeamFlow!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              У вас пока нет команды. Создайте новую или присоединитесь к существующей по приглашению.
            </p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setCurrentPage('team')}
            >
              Перейти к командам
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {isManager ? 'Всего сотрудников' : 'Мои отчеты'}
              </p>
              <p className="text-2xl font-bold">{isManager ? totalMembers : myReports.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {isManager ? 'На проверке' : 'На доработке'}
              </p>
              <p className="text-2xl font-bold">{isManager ? pendingReports : myRevisionReports.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FolderKanban className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Активных проектов</p>
              <p className="text-2xl font-bold">{activeProjects}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ближайших дедлайнов</p>
              <p className="text-2xl font-bold">{upcomingDeadlines}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee quick action */}
      {!isManager && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium">Написать отчет</p>
                <p className="text-sm text-muted-foreground">
                  {myLatestReport
                    ? `Последний: ${statusLabels[myLatestReport.status] || myLatestReport.status}`
                    : 'У вас пока нет отчетов'}
                </p>
              </div>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setCurrentPage('reports')}
            >
              Написать отчет
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Отчеты по неделям</CardTitle>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Нет данных для графика
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Статус проектов</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Нет проектов
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span>{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent reports & Projects */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {isManager ? 'Последние отчеты' : 'Мои отчеты'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('reports')}>
              Все отчеты
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {(isManager ? reports : myReports).slice(0, 5).map((report: {
                id: string; status: string; content: string; author?: { name?: string | null }; weekStart: string; managerComment?: string | null
              }) => (
                <div key={report.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {isManager && report.author?.name ? `${report.author.name}: ` : ''}
                      {report.content.substring(0, 50)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.weekStart).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <Badge className={statusColors[report.status] || ''} variant="secondary">
                    {statusLabels[report.status] || report.status}
                  </Badge>
                </div>
              ))}
              {(!reports || reports.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Нет отчетов</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Проекты</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage('projects')}>
              Все проекты
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {projects?.slice(0, 5).map((project: {
                id: string; name: string; status: string; priority: string; endDate: string | null; milestones: { completed: boolean }[]
              }) => {
                const completedMilestones = project.milestones?.filter((m: { completed: boolean }) => m.completed).length || 0
                const totalMilestones = project.milestones?.length || 1
                const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

                return (
                  <div key={project.id} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{project.name}</p>
                      <Badge className={priorityColors[project.priority] || ''} variant="secondary">
                        {project.priority}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{progress}% завершено</p>
                  </div>
                )
              })}
              {(!projects || projects.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">Нет проектов</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {isManager && teamId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-600" />
              AI-инсайты
            </CardTitle>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
              onClick={() => analyzeMutation.mutate(teamId)}
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? 'Анализирую...' : 'Запустить анализ'}
            </Button>
          </CardHeader>
          <CardContent>
            {analyzeMutation.data ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm">{analyzeMutation.data.summary}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Нажмите «Запустить анализ», чтобы ИИ проанализировал отчеты команды и выдал рекомендации
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
