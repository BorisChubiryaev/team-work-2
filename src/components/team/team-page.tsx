'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus, Users, Copy, Check, UserPlus, Trash2, Shield, Crown, UserCircle,
} from 'lucide-react'

const memberRoleLabels: Record<string, string> = {
  member: 'Участник',
  lead: 'Лидер',
  senior: 'Старший',
}

export function TeamPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDesc, setNewTeamDesc] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copied, setCopied] = useState(false)

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const res = await fetch('/api/teams')
      if (!res.ok) return []
      return res.json()
    },
  })

  const createTeam = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setCreateOpen(false)
      setNewTeamName('')
      setNewTeamDesc('')
    },
  })

  const joinTeam = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setJoinOpen(false)
      setInviteCode('')
    },
  })

  const updateMember = useMutation({
    mutationFn: async ({ teamId, memberId, role }: { teamId: string; memberId: string; role: string }) => {
      const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const removeMember = useMutation({
    mutationFn: async ({ teamId, memberId }: { teamId: string; memberId: string }) => {
      await fetch(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const copyInviteCode = (code: string) => {
    const url = `${window.location.origin}?invite=${code}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return <div className="p-6 space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-48" />)}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Команда</h2>
          <p className="text-sm text-muted-foreground">Управление командой и участниками</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Присоединиться
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Присоединиться к команде</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Введите код приглашения"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                />
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => inviteCode && joinTeam.mutate(inviteCode)}
                  disabled={!inviteCode || joinTeam.isPending}
                >
                  Присоединиться
                </Button>
                {joinTeam.isError && (
                  <p className="text-sm text-destructive">
                    {(joinTeam.error as Error)?.message || 'Ошибка присоединения'}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4 mr-2" />
                Создать команду
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать команду</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Название команды" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} />
                <Textarea placeholder="Описание (опционально)" value={newTeamDesc} onChange={e => setNewTeamDesc(e.target.value)} rows={3} />
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => newTeamName && createTeam.mutate({ name: newTeamName, description: newTeamDesc || undefined })}
                  disabled={!newTeamName || createTeam.isPending}
                >
                  Создать
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Teams */}
      {teams?.map((team: {
        id: string; name: string; description?: string; inviteCode: string; managerId: string;
        manager: { id: string; name?: string | null; email: string };
        members: { id: string; role: string; user: { id: string; name?: string | null; email: string; position?: string | null } }[];
        _count: { members: number; projects: number; reports: number }
      }) => {
        const isManager = team.managerId === (session?.user as { id?: string })?.id

        return (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-600" />
                    {team.name}
                  </CardTitle>
                  {team.description && (
                    <CardDescription className="mt-1">{team.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{team._count?.members || 0} участников</Badge>
                  <Badge variant="secondary">{team._count?.projects || 0} проектов</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Invite code */}
              {isManager && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Код приглашения</p>
                    <p className="text-xs text-muted-foreground font-mono">{team.inviteCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyInviteCode(team.inviteCode)}
                  >
                    {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? 'Скопировано' : 'Скопировать ссылку'}
                  </Button>
                </div>
              )}

              <Separator />

              {/* Members */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Участники</h4>
                <div className="space-y-2">
                  {/* Manager */}
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Crown className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{team.manager?.name || team.manager?.email}</p>
                      <p className="text-xs text-muted-foreground">Руководитель</p>
                    </div>
                  </div>

                  {/* Members */}
                  {team.members?.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                      <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <UserCircle className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.user?.name || member.user?.email}</p>
                        <p className="text-xs text-muted-foreground">{member.user?.position || 'Сотрудник'}</p>
                      </div>
                      {isManager && member.user.id !== (session?.user as { id?: string })?.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(role) => updateMember.mutate({ teamId: team.id, memberId: member.id, role })}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Участник</SelectItem>
                              <SelectItem value="senior">Старший</SelectItem>
                              <SelectItem value="lead">Лидер</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeMember.mutate({ teamId: team.id, memberId: member.id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {memberRoleLabels[member.role] || member.role}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {(!teams || teams.length === 0) && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">У вас нет команд</p>
            <p className="text-muted-foreground text-sm mb-4">Создайте команду или присоединитесь по приглашению</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
