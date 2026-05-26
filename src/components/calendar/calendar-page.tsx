'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import {
  ChevronLeft, ChevronRight, CalendarDays, FileText, FolderKanban, Clock,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, isToday } from 'date-fns'
import { ru } from 'date-fns/locale'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'project' | 'milestone' | 'report'
  color: string
}

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await fetch('/api/reports')
      if (!res.ok) return []
      return res.json()
    },
  })

  const events = useMemo<CalendarEvent[]>(() => {
    const evts: CalendarEvent[] = []

    projects?.forEach((p: { id: string; name: string; endDate: string | null; milestones: { id: string; title: string; dueDate: string; completed: boolean }[] }) => {
      if (p.endDate) {
        evts.push({ id: `project-${p.id}`, title: p.name, date: new Date(p.endDate), type: 'project', color: 'bg-emerald-500' })
      }
      p.milestones?.forEach(m => {
        evts.push({ id: `milestone-${m.id}`, title: m.title, date: new Date(m.dueDate), type: 'milestone', color: m.completed ? 'bg-gray-400' : 'bg-amber-500' })
      })
    })

    reports?.forEach((r: { id: string; weekEnd: string }) => {
      evts.push({ id: `report-${r.id}`, title: 'Дедлайн отчета', date: new Date(r.weekEnd), type: 'report', color: 'bg-blue-500' })
    })

    return evts
  }, [projects, reports])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = getDay(monthStart)
  const blanks = Array.from({ length: (startDay + 6) % 7 }, (_, i) => i)

  const getEventsForDate = (date: Date) =>
    events.filter(e => isSameDay(e.date, date))

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  // Upcoming events
  const upcomingEvents = events
    .filter(e => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10)

  const typeLabels: Record<string, string> = {
    project: 'Проект',
    milestone: 'Этап',
    report: 'Отчет',
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Календарь</h2>
        <p className="text-sm text-muted-foreground">Дедлайны проектов, этапов и отчетов</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-lg">
                {format(currentMonth, 'LLLL yyyy', { locale: ru })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>
              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {blanks.map(i => (
                  <div key={`blank-${i}`} className="h-20" />
                ))}
                {days.map(day => {
                  const dayEvents = getEventsForDate(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  return (
                    <button
                      key={day.toISOString()}
                      className={`h-20 p-1 rounded-lg text-left text-sm border transition-colors ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : isToday(day)
                          ? 'border-emerald-300 bg-emerald-50/50'
                          : 'border-transparent hover:bg-muted'
                      } ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <span className={`text-xs font-medium ${isToday(day) ? 'text-emerald-600' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map(evt => (
                          <div
                            key={evt.id}
                            className={`h-1.5 rounded-full ${evt.color}`}
                            title={evt.title}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected date events */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {selectedDate
                  ? format(selectedDate, 'd MMMM yyyy', { locale: ru })
                  : 'Выберите дату'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateEvents.map(evt => (
                    <div key={evt.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <div className={`h-3 w-3 rounded-full ${evt.color}`} />
                      <div>
                        <p className="text-sm font-medium">{evt.title}</p>
                        <p className="text-xs text-muted-foreground">{typeLabels[evt.type]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Нет событий на эту дату</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" />
                Ближайшие события
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {upcomingEvents.map(evt => (
                  <div
                    key={evt.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => setSelectedDate(evt.date)}
                  >
                    <div className={`h-3 w-3 rounded-full shrink-0 ${evt.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{evt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(evt.date, 'd MMM', { locale: ru })} · {typeLabels[evt.type]}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Нет предстоящих событий</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
