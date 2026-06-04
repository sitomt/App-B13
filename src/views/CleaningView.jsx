import { useState } from 'react'
import { Header, Screen } from '../components/AppShell'
import ScheduleOverlay from '../components/ScheduleOverlay'
import Fichaje from '../components/Fichaje'
import { TaskRow, AnnouncementCard, AdHocCard } from '../components/cards'
import { Card, SectionTitle, ProgressRing, SkeletonList, EmptyState } from '../components/ui'
import { listTemplates, todayCompletions, listAdHoc, activeAnnouncements } from '../lib/api'
import { useData } from '../lib/useData'
import { buildAgenda } from '../lib/agenda'
import { useSession } from '../state/session'
import { Map, Spray, Megaphone, Activity, Alert } from '../components/icons'

export default function CleaningView() {
  const { employee } = useSession()
  const [schedule, setSchedule] = useState(false)
  const tpl = useData(() => listTemplates('cleaning'), [])
  const comp = useData(() => todayCompletions('cleaning'), [], { interval: 45000 })
  const adhoc = useData(() => listAdHoc('cleaning'), [], { interval: 20000 })
  const ann = useData(() => activeAnnouncements('cleaning'), [], { interval: 60000 })

  const reload = () => Promise.all([comp.reload(true), adhoc.reload(true)])
  const agenda = buildAgenda(tpl.data, comp.data)

  const daily = agenda.sections.agenda.filter((i) => i.category === 'diaria')
  const weekly = agenda.sections.agenda.filter((i) => i.category === 'semanal')
  const dailyDone = daily.filter((i) => i.done).length

  const urgentPending = (adhoc.data || []).filter((t) => t.status === 'pending' && t.priority === 'urgent')
  const otherAdhoc = (adhoc.data || []).filter((t) => !(t.status === 'pending' && t.priority === 'urgent'))

  if (schedule) return <ScheduleOverlay onClose={() => setSchedule(false)} />

  return (
    <Screen>
      <Header subtitle="Tu ruta" onCalendar={() => setSchedule(true)} />

      <div className="mx-auto max-w-md space-y-5 px-4 pt-4">
        {/* AVISOS URGENTES — máxima prioridad, fijados arriba */}
        {urgentPending.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1 text-terracotta">
              <Alert size={18} />
              <h2 className="font-display text-xl font-bold">Aviso urgente del admin</h2>
            </div>
            {urgentPending.map((t) => (
              <AdHocCard key={t.id} task={t} employee={employee} onChange={reload} />
            ))}
          </div>
        )}

        <Fichaje employee={employee} />

        {ann.data && ann.data.length > 0 && (
          <div className="space-y-2">
            <SectionTitle icon={Megaphone}>Avisos</SectionTitle>
            {ann.data.map((a) => <AnnouncementCard key={a.id} a={a} />)}
          </div>
        )}

        {tpl.loading ? (
          <SkeletonList rows={4} />
        ) : (
          <>
            <Card className="flex items-center gap-4 p-4">
              <ProgressRing value={daily.length ? dailyDone / daily.length : 0} size={64} color="#5B7A8C">
                <span className="tabular font-display text-xl font-extrabold text-ink">{dailyDone}/{daily.length}</span>
              </ProgressRing>
              <div className="flex-1">
                <p className="font-display text-xl font-bold text-ink">Ruta de hoy</p>
                <p className="text-sm text-ink/50">Tareas diarias obligatorias</p>
              </div>
            </Card>

            {/* Ruta diaria */}
            {daily.length > 0 && (
              <div>
                <SectionTitle icon={Map}>Ruta diaria</SectionTitle>
                <Card className="divide-y divide-ink/[0.06]">
                  {daily.map((i, idx) => (
                    <div key={i.id} className="animate-rise-in" style={{ animationDelay: `${idx * 35}ms` }}>
                      <TaskRow item={i} employee={employee} onChange={reload} />
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* Tarea semanal rotativa de hoy */}
            {weekly.length > 0 && (
              <div>
                <SectionTitle icon={Spray}>Hoy además toca</SectionTitle>
                <Card className="divide-y divide-ink/[0.06]">
                  {weekly.map((i, idx) => (
                    <div key={i.id} className="animate-rise-in" style={{ animationDelay: `${idx * 35}ms` }}>
                      <TaskRow item={i} employee={employee} onChange={reload} />
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* Otras tareas puntuales (normales o ya hechas) */}
            {otherAdhoc.length > 0 && (
              <div className="space-y-2">
                <SectionTitle icon={Activity}>Tareas puntuales</SectionTitle>
                {otherAdhoc.map((t) => <AdHocCard key={t.id} task={t} employee={employee} onChange={reload} />)}
              </div>
            )}

            {!daily.length && !weekly.length && (
              <EmptyState icon={Map} title="Sin ruta hoy" subtitle="No hay tareas de limpieza configuradas." />
            )}
          </>
        )}
      </div>
    </Screen>
  )
}
