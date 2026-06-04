import { useState } from 'react'
import Fichaje from '../../components/Fichaje'
import { TaskRow, AnnouncementCard } from '../../components/cards'
import { Card, SectionTitle, ProgressRing, SkeletonList, EmptyState } from '../../components/ui'
import { listTemplates, todayCompletions, activeAnnouncements, completeTask } from '../../lib/api'
import { useData } from '../../lib/useData'
import { buildAgenda } from '../../lib/agenda'
import { haptic } from '../../lib/haptics'
import { useToast } from '../../components/Toast'
import { useSession } from '../../state/session'
import { Sunrise, Moon, Activity, Megaphone, ChevronDown, Check } from '../../components/icons'

function Collapsible({ icon: Icon, title, count, total, defaultOpen = true, action, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const complete = total > 0 && count === total
  return (
    <Card className="overflow-hidden">
      {/* Cabecera: la zona de título/chevron despliega; la acción es un botón aparte */}
      <div className="flex w-full items-center gap-2 p-4">
        <button onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${complete ? 'bg-sage/15 text-sage' : 'bg-ink/5 text-ink/60'}`}>
            {complete ? <Check size={20} /> : <Icon size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-ink">{title}</p>
            <p className="text-xs text-ink/45">{count}/{total} completadas</p>
          </div>
        </button>
        {action}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Contraer' : 'Desplegar'}
          className="shrink-0 p-1 transition-enter active:scale-90"
        >
          <ChevronDown size={20} className={`text-ink/30 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && <div className="divide-y divide-ink/[0.06] border-t border-ink/[0.06]">{children}</div>}
    </Card>
  )
}

export default function CoachToday() {
  const { employee } = useSession()
  const toast = useToast()
  const tpl = useData(() => listTemplates('coach'), [])
  const comp = useData(() => todayCompletions('coach'), [], { interval: 45000 })
  const ann = useData(() => activeAnnouncements('coach'), [], { interval: 60000 })
  const [bulkBusy, setBulkBusy] = useState(false)

  const loading = tpl.loading || comp.loading
  const reload = () => Promise.all([comp.reload(true)])

  const { sections, dayProgress, dayDone, dayTotal } = buildAgenda(tpl.data, comp.data)

  // Marca de una vez todas las tareas que falten de una sección (sin abrir el toggle).
  const aperturaPending = sections.apertura.filter((i) => !i.recurring && !i.done)
  const cierrePending = sections.cierre.filter((i) => !i.recurring && !i.done)
  async function markAllSection(pending, label) {
    if (bulkBusy || pending.length === 0) return
    setBulkBusy(true)
    haptic('success')
    try {
      await Promise.all(pending.map((i) => completeTask(i, employee)))
      toast(`${label} completada · ${pending.length} tareas ✓`)
      await reload()
    } catch {
      toast('No se pudieron completar todas', 'error')
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div className="space-y-5 pb-24">
      <Fichaje employee={employee} />

      {ann.data && ann.data.length > 0 && (
        <div className="space-y-2">
          <SectionTitle icon={Megaphone}>Avisos de hoy</SectionTitle>
          {ann.data.map((a) => <AnnouncementCard key={a.id} a={a} />)}
        </div>
      )}

      {loading ? (
        <SkeletonList rows={4} />
      ) : (
        <>
          <Card className="flex items-center gap-4 p-4">
            <ProgressRing value={dayProgress} size={64}>
              <span className="tabular font-display text-xl font-extrabold text-ink">{Math.round(dayProgress * 100)}%</span>
            </ProgressRing>
            <div className="flex-1">
              <p className="font-display text-xl font-bold text-ink">Tu día</p>
              <p className="text-sm text-ink/50">{dayDone} de {dayTotal} tareas hechas</p>
            </div>
          </Card>

          {sections.apertura.length > 0 && (
            <Collapsible icon={Sunrise} title="Apertura"
              count={sections.apertura.filter((i) => i.done).length}
              total={sections.apertura.filter((i) => !i.recurring).length}
              defaultOpen={sections.apertura.some((i) => !i.done)}
              action={aperturaPending.length > 0 && (
                <button
                  onClick={() => markAllSection(aperturaPending, 'Apertura')}
                  disabled={bulkBusy}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-sage px-3 py-1.5 text-xs font-bold text-white transition-enter active:scale-95 disabled:opacity-50"
                >
                  <Check size={14} /> Marcar todo
                </button>
              )}>
              {sections.apertura.map((i, idx) => (
                <div key={i.id} className="animate-rise-in" style={{ animationDelay: `${idx * 35}ms` }}>
                  <TaskRow item={i} employee={employee} onChange={reload} />
                </div>
              ))}
            </Collapsible>
          )}

          {sections.agenda.length > 0 && (
            <div>
              <SectionTitle icon={Activity}>Tareas de hoy</SectionTitle>
              <Card className="divide-y divide-ink/[0.06]">
                {sections.agenda.map((i, idx) => (
                  <div key={i.id} className="animate-rise-in" style={{ animationDelay: `${idx * 35}ms` }}>
                    <TaskRow item={i} employee={employee} onChange={reload} />
                  </div>
                ))}
              </Card>
            </div>
          )}

          {sections.cierre.length > 0 && (
            <Collapsible icon={Moon} title="Cierre"
              count={sections.cierre.filter((i) => i.done).length}
              total={sections.cierre.filter((i) => !i.recurring).length}
              defaultOpen={false}
              action={cierrePending.length > 0 && (
                <button
                  onClick={() => markAllSection(cierrePending, 'Cierre')}
                  disabled={bulkBusy}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-sage px-3 py-1.5 text-xs font-bold text-white transition-enter active:scale-95 disabled:opacity-50"
                >
                  <Check size={14} /> Marcar todo
                </button>
              )}>
              {sections.cierre.map((i, idx) => (
                <div key={i.id} className="animate-rise-in" style={{ animationDelay: `${idx * 35}ms` }}>
                  <TaskRow item={i} employee={employee} onChange={reload} />
                </div>
              ))}
            </Collapsible>
          )}

          {!sections.apertura.length && !sections.agenda.length && (
            <EmptyState icon={Activity} title="Sin tareas hoy" subtitle="No hay plantillas configuradas para hoy." />
          )}
        </>
      )}
    </div>
  )
}
