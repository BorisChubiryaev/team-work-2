'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus, FolderKanban, ChevronRight, ChevronDown, CheckSquare, Square, Trash2, Calendar,
} from 'lucide-react'

const statusLabels: Record<string, string> = {
  active: 'Активный',
  paused: 'Приостановлен',
  completed: 'Завершен',
  cancelled: 'Отменен',
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

interface ProjectItem {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  startDate?: string | null
  endDate?: string | null
  parentId?: string | null
  children?: ProjectItem[]
  milestones: { id: string; title: string; completed: boolean; dueDate: string }[]
  team?: { name: string }
}

function ProjectTreeNode({ project, onEdit, depth = 0 }: { project: ProjectItem; onEdit: (p: ProjectItem) => void; depth?: number }) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState(true)

  const completedMilestones = project.milestones?.filter(m => m.completed).length || 0
  const totalMilestones = project.milestones?.length || 0
  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  const toggleMilestone = useMutation({
    mutationFn: async ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) => {
      const res = await fetch(`/api/projects/${project.id}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const updateProject = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  const deleteMilestone = useMutation({
    mutationFn: async (milestoneId: string) => {
      await fetch(`/api/projects/${project.id}/milestones/${milestoneId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  return (
    <div>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        style={{ marginLeft: depth * 24 }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {project.children && project.children.length > 0 && (
              <button onClick={() => setExpanded(!expanded)} className="mt-1">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            <div className="flex-1 min-w-0" onClick={() => onEdit(project)}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="font-semibold">{project.name}</h3>
                <Badge className={statusColors[project.status] || ''} variant="secondary">
                  {statusLabels[project.status] || project.status}
                </Badge>
                <Badge className={priorityColors[project.priority] || ''} variant="secondary">
                  {priorityLabels[project.priority] || project.priority}
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {project.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Дедлайн: {new Date(project.endDate).toLocaleDateString('ru-RU')}
                  </span>
                )}
                <span>{completedMilestones}/{totalMilestones} этапов</span>
              </div>
              {totalMilestones > 0 && (
                <div className="mt-2">
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
            <Select
              value={project.status}
              onValueChange={(val) => updateProject.mutate({ id: project.id, status: val })}
            >
              <SelectTrigger className="w-36 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Активный</SelectItem>
                <SelectItem value="paused">Приостановлен</SelectItem>
                <SelectItem value="completed">Завершен</SelectItem>
                <SelectItem value="cancelled">Отменен</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <div className="mt-3 ml-6 space-y-1">
              {project.milestones.map(m => (
                <div key={m.id} className="flex items-center gap-2 text-sm group">
                  <button onClick={() => toggleMilestone.mutate({ milestoneId: m.id, completed: !m.completed })}>
                    {m.completed ? (
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <span className={m.completed ? 'line-through text-muted-foreground' : ''}>{m.title}</span>
                  <span className="text-xs text-muted-foreground">
                    ({new Date(m.dueDate).toLocaleDateString('ru-RU')})
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteMilestone.mutate(m.id)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Children */}
      {expanded && project.children?.map(child => (
        <ProjectTreeNode key={child.id} project={child} onEdit={onEdit} depth={depth + 1} />
      ))}
    </div>
  )
}

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<ProjectItem | null>(null)
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false)

  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newEndDate, setNewEndDate] = useState('')
  const [newParentId, setNewParentId] = useState('none')
  const [newTeamId, setNewTeamId] = useState('')
  const [milestoneTitle, setMilestoneTitle] = useState('')
  const [milestoneDue, setMilestoneDue] = useState('')

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) return []
      return res.json()
    },
  })

  const createProject = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setCreateOpen(false)
      setNewName('')
      setNewDesc('')
    },
  })

  const addMilestone = useMutation({
    mutationFn: async ({ projectId, title, dueDate }: { projectId: string; title: string; dueDate: string }) => {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueDate }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setAddMilestoneOpen(false)
      setMilestoneTitle('')
      setMilestoneDue('')
    },
  })

  if (isLoading) {
    return <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
  }

  // Build tree: find root projects (no parent)
  const rootProjects = projects?.filter((p: ProjectItem) => !p.parentId) || []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Проекты</h2>
          <p className="text-sm text-muted-foreground">Управление проектами и этапами</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Новый проект
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать проект</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Название проекта" value={newName} onChange={e => setNewName(e.target.value)} />
              <Textarea placeholder="Описание (опционально)" value={newDesc} onChange={e => setNewDesc(e.target.value)} rows={3} />
              <div className="grid grid-cols-2 gap-4">
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger><SelectValue placeholder="Приоритет" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="critical">Критический</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} placeholder="Дедлайн" />
              </div>
              <Select value={newParentId} onValueChange={setNewParentId}>
                <SelectTrigger><SelectValue placeholder="Родительский проект" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Нет родительского</SelectItem>
                  {projects?.map((p: ProjectItem) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  if (!teamId || !newName) return
                  createProject.mutate({
                    name: newName,
                    description: newDesc || undefined,
                    priority: newPriority,
                    endDate: newEndDate || undefined,
                    teamId,
                    parentId: newParentId === 'none' ? undefined : newParentId || undefined,
                  })
                }}
                disabled={!newName || createProject.isPending}
              >
                Создать проект
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Tree */}
      <div className="space-y-3">
        {rootProjects.map((project: ProjectItem) => (
          <ProjectTreeNode
            key={project.id}
            project={project}
            onEdit={(p) => setEditProject(p)}
          />
        ))}
        {rootProjects.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Нет проектов</p>
              <p className="text-muted-foreground text-sm">Создайте первый проект для вашей команды</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Milestone Dialog */}
      <Dialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить этап</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Название этапа" value={milestoneTitle} onChange={e => setMilestoneTitle(e.target.value)} />
            <Input type="date" value={milestoneDue} onChange={e => setMilestoneDue(e.target.value)} />
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (!editProject || !milestoneTitle || !milestoneDue) return
                addMilestone.mutate({ projectId: editProject.id, title: milestoneTitle, dueDate: milestoneDue })
              }}
              disabled={!milestoneTitle || !milestoneDue || addMilestone.isPending}
            >
              Добавить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project - Add Milestone button */}
      {editProject && (
        <div className="fixed bottom-4 right-4">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            onClick={() => setAddMilestoneOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить этап к «{editProject.name}»
          </Button>
        </div>
      )}
    </div>
  )
}
