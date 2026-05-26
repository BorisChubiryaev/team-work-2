import { create } from 'zustand'

export type PageType = 'landing' | 'auth' | 'dashboard' | 'reports' | 'projects' | 'calendar' | 'retro' | 'team' | 'settings'

interface AppState {
  currentPage: PageType
  setCurrentPage: (page: PageType) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  selectedTeamId: string | null
  setSelectedTeamId: (id: string | null) => void
  selectedReportId: string | null
  setSelectedReportId: (id: string | null) => void
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  selectedRetroId: string | null
  setSelectedRetroId: (id: string | null) => void
  inviteCode: string | null
  setInviteCode: (code: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'landing',
  setCurrentPage: (page) => set({ currentPage: page }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedTeamId: null,
  setSelectedTeamId: (id) => set({ selectedTeamId: id }),
  selectedReportId: null,
  setSelectedReportId: (id) => set({ selectedReportId: id }),
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  selectedRetroId: null,
  setSelectedRetroId: (id) => set({ selectedRetroId: id }),
  inviteCode: null,
  setInviteCode: (code) => set({ inviteCode: code }),
}))
