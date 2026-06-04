import { useState } from 'react'
import { Header, Screen, Fab } from '../components/AppShell'
import { Card, SectionTitle, Pill, Skeleton, EmptyState } from '../components/ui'
import Sheet from '../components/Sheet'
import ReportIncident from '../components/ReportIncident'
import ScheduleOverlay from '../components/ScheduleOverlay'
import { listMaintenance, updateMaintenance, activeAnnouncements } from '../lib/api'
import { useData } from '../lib/useData'
import { useSession } from '../state/session'
import { useToast } from '../components/Toast'
import { AnnouncementCard } from '../components/cards'
import { Wrench, Alert, Check, Clock, User, Megaphone, Plus } from '../components/icons'
import { relativeTime, timeHM } from '../lib/date'

const STATUS = {
  pending: { label: 'Pendiente', pill: 'terracotta' },
  in_progress: { label: 'En curso', pill: 'ochre' },
  done: { label: 'Resuelta', pill: 'sage' },
}

function IncidentCard({ inc, onStart, onResolve }) {
  const urgent = inc.priority === 'urgent'
  const done = inc.status === 'done'
  return (
    <Card className={`overflow-hidden ${done ? 'opacity-70' : ''}`}>
      <div className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <Pill color={STATUS[inc.status].pill}>{STATUS[inc.status].label}</Pill>
          {urgent && !done && <Pill color="terracotta">URGENTE</Pill>}
          {inc.category && <span className="text-xs font-semibold text-ink/40">{inc.category}</span>}
          <span className="ml-auto text-xs text-ink/35">{relativeTime(inc.created_at)}</span>
        </div>
        <p className="font-display text-lg font-bold leading-tight text-ink">{inc.title}</p>
        {inc.zone && <p className="text-sm font-semibold text-bronze-dark">{inc.zone}</p>}
        {inc.description && <p className="mt-1 text-sm text-ink/60">{inc.description}</p>}
        {inc.photo_url && (
          <a href={inc.photo_url} target="_blank" rel="noreferrer" className="mt-2 block">
            <img src={inc.photo_url} alt="incidencia" className="h-40 w-full rounded-xl object-cover" loading="lazy" />
          </a>
        )}
        <p className="mt-2 flex items-center gap-1 text-xs text-ink/40">
          <User size={12} /> Reportado por {inc.reported_by_name || 'desconocido'}
        </p>
        {done && inc.resolution_notes && (
          <div className="mt-2 rounded-xl bg-sage/8 p-2.5 text-sm text-sage">
            <span className="font-semibold">Resolución:</span> {inc.resolution_notes}
          </div>
        )}
      </div>
      {!done && (
        <div className="flex border-t border-ink/[0.06]">
          {inc.status === 'pending' && (
            <button onClick={() => onStart(inc)} className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-bold text-ochre active:bg-ink/[0.03]">
              <Clock size={16} /> Empezar
            </button>
          )}
          <button onClick={() => onResolve(inc)} className="flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-bold text-sage active:bg-ink/[0.03]">
            <Check size={16} /> Marcar resuelta
          </button>
        </div>
      )}
    </Card>
  )
}

export default function MaintenanceView() {
  const { employee } = useSession()
  const toast = useToast()
  const inc = useData(listMaintenance, [], { interval: 20000 })
  const ann = useData(() => activeAnnouncements('maintenance'), [], { interval: 60000 })
  const [resolving, setResolving] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [schedule, setSchedule] = useState(false)

  const list = inc.data || []
  const pending = list.filter((i) => i.status === 'pending')
  const inProgress = list.filter((i) => i.status === 'in_progress')
  const done = list.filter((i) => i.status === 'done')

  async function start(i) {
    try {
      await updateMaintenance(i.id, {
        status: 'in_progress',
        assigned_to: employee.id,
        started_at: i.started_at || new Date().toISOString(),
        started_by_name: i.started_by_name || employee.name,
      })
      await inc.reload(true)
      toast('Incidencia en curso')
    } catch { toast('No se pudo actualizar', 'error') }
  }

  async function confirmResolve() {
    setBusy(true)
    try {
      await updateMaintenance(resolving.id, {
        status: 'done',
        assigned_to: employee.id,
        resolved_by_name: employee.name,
        resolution_notes: note.trim() || null,
        resolved_at: new Date().toISOString(),
      })
      await inc.reload(true)
      toast('Parte resuelto ✓')
      setResolving(null); setNote('')
    } catch { toast('No se pudo actualizar', 'error') } finally { setBusy(false) }
  }

  if (schedule) return <ScheduleOverlay onClose={() => setSchedule(false)} />

  return (
    <Screen>
      <Header subtitle="Mantenimiento" onCalendar={() => setSchedule(true)} />
      <div className="mx-auto max-w-md space-y-5 px-4 pt-4">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: pending.length, label: 'Pendientes', color: 'text-terracotta' },
            { n: inProgress.length, label: 'En curso', color: 'text-ochre' },
            { n: done.length, label: 'Resueltas', color: 'text-sage' },
          ].map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <p className={`font-display text-3xl font-extrabold ${s.color}`}>{s.n}</p>
              <p className="text-xs text-ink/45">{s.label}</p>
            </Card>
          ))}
        </div>

        {ann.data && ann.data.length > 0 && ann.data.map((a) => <AnnouncementCard key={a.id} a={a} />)}

        {inc.loading ? (
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-28 w-full rounded-xl2" />
            <Skeleton className="h-28 w-full rounded-xl2" />
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <SectionTitle icon={Alert}>Pendientes</SectionTitle>
                <div className="space-y-3">
                  {pending.map((i, idx) => (
                    <div key={i.id} className="animate-rise-in" style={{ animationDelay: `${idx * 35}ms` }}>
                      <IncidentCard inc={i} onStart={start} onResolve={setResolving} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {inProgress.length > 0 && (
              <div>
                <SectionTitle icon={Clock}>En curso</SectionTitle>
                <div className="space-y-3">
                  {inProgress.map((i, idx) => (
                    <div key={i.id} className="animate-rise-in" style={{ animationDelay: `${idx * 35}ms` }}>
                      <IncidentCard inc={i} onStart={start} onResolve={setResolving} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {done.length > 0 && (
              <div>
                <SectionTitle icon={Check}>Resueltas</SectionTitle>
                <div className="space-y-3">
                  {done.map((i) => <IncidentCard key={i.id} inc={i} onStart={start} onResolve={setResolving} />)}
                </div>
              </div>
            )}
            {!list.length && <EmptyState icon={Wrench} title="Todo en orden" subtitle="No hay incidencias reportadas." />}
          </>
        )}
      </div>

      <Fab icon={Plus} ariaLabel="Nueva tarea de mantenimiento" tone="bronze" onClick={() => setReportOpen(true)} />
      <ReportIncident open={reportOpen} onClose={() => setReportOpen(false)} employee={employee} onCreated={() => inc.reload(true)} />

      <Sheet open={!!resolving} onClose={() => setResolving(null)} title="Resolver parte">
        {resolving && (
          <>
            <p className="mb-1 font-display text-xl font-bold">{resolving.title}</p>
            <p className="mb-4 text-sm text-ink/50">{resolving.zone}</p>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40">Nota de resolución (opcional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Qué se ha hecho para arreglarlo…"
              className="mb-5 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-bronze"
            />
            <button onClick={confirmResolve} disabled={busy} className="w-full rounded-2xl bg-sage py-4 text-lg font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50">
              Marcar como resuelta
            </button>
          </>
        )}
      </Sheet>
    </Screen>
  )
}
