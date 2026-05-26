'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { LandingPage } from '@/components/landing/landing-page'
import { AuthForm } from '@/components/app/auth-form'
import { AppShell } from '@/components/app/app-shell'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { ReportsPage } from '@/components/reports/reports-page'
import { ProjectsPage } from '@/components/projects/projects-page'
import { CalendarPage } from '@/components/calendar/calendar-page'
import { RetroPage } from '@/components/retro/retro-page'
import { TeamPage } from '@/components/team/team-page'
import { SettingsPage } from '@/components/settings/settings-page'

function AppContent() {
  const { data: session, status } = useSession()
  const { currentPage, setCurrentPage, setInviteCode } = useAppStore()

  // Check for invite code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const invite = params.get('invite')
    if (invite) {
      setInviteCode(invite)
      if (session) {
        setCurrentPage('team')
      }
    }
  }, [session, setCurrentPage, setInviteCode])

  // Redirect based on auth state
  useEffect(() => {
    if (status === 'authenticated' && (currentPage === 'landing' || currentPage === 'auth')) {
      setCurrentPage('dashboard')
    }
    if (status === 'unauthenticated' && currentPage !== 'landing' && currentPage !== 'auth') {
      setCurrentPage('landing')
    }
  }, [status, currentPage, setCurrentPage])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center animate-pulse">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">Загрузка TeamFlow...</p>
        </div>
      </div>
    )
  }

  // Unauthenticated views
  if (!session) {
    if (currentPage === 'auth') {
      return <AuthForm />
    }
    return <LandingPage />
  }

  // Authenticated views
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'reports':
        return <ReportsPage />
      case 'projects':
        return <ProjectsPage />
      case 'calendar':
        return <CalendarPage />
      case 'retro':
        return <RetroPage />
      case 'team':
        return <TeamPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return <AppShell>{renderPage()}</AppShell>
}

export default function Home() {
  return <AppContent />
}
