'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useTheme } from 'next-themes'
import { Settings, User, Palette, Bell, Save } from 'lucide-react'

export function SettingsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()

  const user = session?.user as { id?: string; name?: string | null; email?: string | null; position?: string | null; department?: string | null; role?: string }
  const [name, setName] = useState(user?.name || '')
  const [position, setPosition] = useState(user?.position || '')
  const [department, setDepartment] = useState(user?.department || '')

  const updateProfile = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] })
    },
  })

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Настройки</h2>
        <p className="text-sm text-muted-foreground">Управление профилем и параметрами</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Профиль
          </CardTitle>
          <CardDescription>Обновите ваши личные данные</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Должность</Label>
            <Input id="position" value={position} onChange={e => setPosition(e.target.value)} placeholder="Разработчик, Дизайнер..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Отдел</Label>
            <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Разработка, Маркетинг..." />
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => updateProfile.mutate({ name, position, department })}
            disabled={updateProfile.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateProfile.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Оформление
          </CardTitle>
          <CardDescription>Настройки внешнего вида приложения</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Тёмная тема</p>
              <p className="text-xs text-muted-foreground">Переключить между светлой и тёмной темой</p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Уведомления
          </CardTitle>
          <CardDescription>Настройки уведомлений</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email-уведомления</p>
              <p className="text-xs text-muted-foreground">Получать уведомления на почту</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Уведомления о дедлайнах</p>
              <p className="text-xs text-muted-foreground">Напоминания о приближающихся дедлайнах</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Уведомления об отчетах</p>
              <p className="text-xs text-muted-foreground">Оповещения о статусе ваших отчетов</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
