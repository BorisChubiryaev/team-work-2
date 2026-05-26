'use client'

import { useSession, signOut } from 'next-auth/react'
import { useAppStore, type PageType } from '@/lib/store'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  FileText,
  FolderKanban,
  CalendarDays,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Sun,
  Moon,
  Zap,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

interface NavItem {
  id: PageType
  label: string
  icon: React.ReactNode
  badge?: number
  roles?: string[]
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [notifOpen, setNotifOpen] = useState(false)

  const userRole = (session?.user as { role?: string })?.role || 'employee'

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) return []
      return res.json()
    },
    refetchInterval: 30000,
  })

  const unreadCount = notifications?.filter((n: { read: boolean }) => !n.read).length || 0

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Дашборд', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'reports', label: 'Отчеты', icon: <FileText className="h-5 w-5" /> },
    { id: 'projects', label: 'Проекты', icon: <FolderKanban className="h-5 w-5" /> },
    { id: 'calendar', label: 'Календарь', icon: <CalendarDays className="h-5 w-5" /> },
    { id: 'retro', label: 'Ретро', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'team', label: 'Команда', icon: <Users className="h-5 w-5" />, roles: ['manager', 'admin'] },
    { id: 'settings', label: 'Настройки', icon: <Settings className="h-5 w-5" /> },
  ]

  const filteredNav = navItems.filter(
    item => !item.roles || item.roles.includes(userRole)
  )

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
    })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } border-r bg-card transition-all duration-300 flex flex-col shrink-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {sidebarOpen && (
            <span className="ml-2 text-lg font-bold">TeamFlow</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {filteredNav.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && item.badge && (
                  <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>

        {/* User */}
        <div className="border-t p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                {session?.user?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.name || 'Пользователь'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {userRole === 'manager' ? 'Руководитель' : 'Сотрудник'}
                </p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="flex gap-1 mt-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b flex items-center px-6 gap-4 shrink-0 bg-card">
          <h1 className="text-lg font-semibold">
            {filteredNav.find(n => n.id === currentPage)?.label || 'TeamFlow'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-600 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b">
                    <h3 className="font-semibold text-sm">Уведомления</h3>
                  </div>
                  {notifications?.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">Нет уведомлений</p>
                  ) : (
                    notifications?.map((n: { id: string; title: string; message: string; read: boolean; createdAt: string; type: string }) => (
                      <button
                        key={n.id}
                        className={`w-full text-left p-3 border-b hover:bg-muted transition-colors ${!n.read ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                        onClick={() => {
                          markRead(n.id)
                          setNotifOpen(false)
                        }}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
