import { useEffect, useMemo, useState } from 'react'
import {
  listEmployees, listShifts, rangeTimeEntries,
  createShift, updateShift, deleteShift,
  getScheduleWeek, publishWeek, unpublishWeek,
} from '../lib/api'
import { useData } from '../lib/useData'
import { useSession } from '../state/session'
import { useToast } from '../components/Toast'
import { haptic } from '../lib/haptics'
import { Card, SectionTitle, Pill, SkeletonList, EmptyState } from '../components/ui'
import Sheet from '../components/Sheet'
import { Chevron, Calendar, Clock, Trash, User, Plus, Check, Lock } from '../components/icons'
import { weekBounds, monthBounds, dowLabel, parseDate, isTodayStr, todayMadrid } from '../lib/date'
import { workedMinutesByEmployee, fmtMinutes } from '../lib/hours'

const ROLE_ORDER = ['coach', 'cleaning', 'maintenance']
const ROLE_GROUP = { coach: 'Coaches', cleaning: 'Limpieza', maintenance: 'Mantenimiento' }
const PUESTOS = ['Recepción', 'Sala', 'Clases', 'Otro']

const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
// "7" / "7:30" (sin ceros a la izquierda, sin :00)
const hLabel = (t) => { const [h, m] = t.split(':').map(Number); return m === 0 ? `${h}` : `${h}:${String(m).padStart(2, '0')}` }
const range = (s) => `${hLabel(s.start_time)}–${hLabel(s.end_time)}`

function Avatar({ emp, size = 28 }) {
  const ini = emp.name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full font-display font-extrabold text-white"
      style={{ background: emp.color, width: size, height: size, fontSize: size * 0.38 }}>
      {ini}
    </span>
  )
}

// ------- Cuadrante semanal (rota): empleados x 7 días -------
function WeekGrid({ staffByRole, days, shiftsByEmpDay, selectedDay, onSelectDay, employee, editable, onCellTap }) {
  return (
    <Card className="overflow-hidden p-0">
      {/* Cabecera de días */}
      <div className="grid grid-cols-[68px_repeat(7,minmax(0,1fr))] border-b border-ink/[0.06] bg-sand-50">
        <div className="px-2 py-2" />
        {days.map((d) => {
          const today = isTodayStr(d)
          const sel = d === selectedDay
          return (
            <button key={d} onClick={() => onSelectDay(d)}
              className={`flex flex-col items-center py-2 ${sel ? 'bg-ink text-white' : today ? 'text-bronze-dark' : 'text-ink/50'}`}>
              <span className="text-[10px] font-bold">{dowLabel(d)}</span>
              <span className="font-display text-base font-extrabold leading-none tabular">{parseDate(d).getDate()}</span>
            </button>
          )
        })}
      </div>

      {ROLE_ORDER.map((role) => {
        const list = staffByRole[role] || []
        if (!list.length) return null
        return (
          <div key={role}>
            <p className="bg-sand-50/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-ink/40">{ROLE_GROUP[role]}</p>
            {list.map((e) => {
              const isMe = e.id === employee.id
              return (
                <div key={e.id} className={`grid grid-cols-[68px_repeat(7,minmax(0,1fr))] border-b border-ink/[0.04] ${isMe ? 'bg-bronze/[0.05]' : ''}`}>
                  <div className="flex items-center gap-1.5 px-2 py-2">
                    <Avatar emp={e} size={22} />
                    <span className="truncate text-[11px] font-semibold text-ink">{e.name.split(' ')[0]}</span>
                  </div>
                  {days.map((d) => {
                    const shifts = shiftsByEmpDay.get(e.id)?.get(d) || []
                    return (
                      <button
                        key={d}
                        disabled={!editable}
                        onClick={() => editable && onCellTap(e, d)}
                        className={`flex min-h-[40px] flex-col items-center justify-center gap-0.5 border-l border-ink/[0.04] px-0.5 py-1 ${editable ? 'active:bg-ink/[0.04]' : ''}`}
                      >
                        {shifts.length === 0 ? (
                          <span className="text-ink/15">{editable ? '+' : '·'}</span>
                        ) : (
                          shifts.map((s) => (
                            <span key={s.id} className="w-full truncate rounded text-center text-[9px] font-bold leading-tight tabular"
                              style={{ background: e.color + '26', color: e.color, padding: '1px 2px' }}>
                              {range(s)}
                            </span>
                          ))
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )
      })}
    </Card>
  )
}

// ------- Timeline del día: cobertura por horas (rango dinámico) -------
function DayTimeline({ day, dayShifts, empById }) {
  if (dayShifts.length === 0) {
    return <EmptyState icon={Lock} title="Cerrado" subtitle="Sin turnos asignados este día." />
  }
  const starts = dayShifts.map((s) => toMin(s.start_time))
  const ends = dayShifts.map((s) => toMin(s.end_time))
  const rangeStart = Math.floor(Math.min(...starts) / 60) * 60
  const rangeEnd = Math.ceil(Math.max(...ends) / 60) * 60
  const total = Math.max(60, rangeEnd - rangeStart)
  const pct = (min) => ((min - rangeStart) / total) * 100

  // Ticks de hora (cada 1 o 2h según amplitud)
  const step = total / 60 > 9 ? 120 : 60
  const ticks = []
  for (let m = rangeStart; m <= rangeEnd; m += step) ticks.push(m)

  // Agrupar por empleado
  const byEmp = new Map()
  for (const s of dayShifts) {
    if (!byEmp.has(s.employee_id)) byEmp.set(s.employee_id, [])
    byEmp.get(s.employee_id).push(s)
  }

  return (
    <Card className="p-3">
      {/* Regla de horas */}
      <div className="relative mb-1 ml-[68px] h-4">
        {ticks.map((m) => (
          <span key={m} className="absolute -translate-x-1/2 text-[9px] font-bold text-ink/35 tabular" style={{ left: `${pct(m)}%` }}>
            {Math.floor(m / 60)}h
          </span>
        ))}
      </div>
      <div className="space-y-1.5">
        {[...byEmp.entries()].map(([empId, shifts]) => {
          const e = empById.get(empId)
          if (!e) return null
          return (
            <div key={empId} className="flex items-center gap-2">
              <span className="w-[60px] shrink-0 truncate text-[11px] font-semibold text-ink">{e.name.split(' ')[0]}</span>
              <div className="relative h-7 flex-1 rounded-lg bg-ink/[0.04]">
                {shifts.map((s) => {
                  const left = pct(toMin(s.start_time))
                  const width = pct(toMin(s.end_time)) - left
                  return (
                    <div key={s.id} className="absolute top-0 flex h-7 items-center overflow-hidden rounded-lg px-1.5 text-[9px] font-bold text-white"
                      style={{ left: `${left}%`, width: `${width}%`, background: e.color }}
                      title={`${range(s)}${s.puesto ? ' · ' + s.puesto : ''}`}>
                      <span className="truncate tabular">{range(s)}{s.puesto ? ` · ${s.puesto}` : ''}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default function ScheduleScreen({ editable = false }) {
  const { employee } = useSession()
  const toast = useToast()
  const [offset, setOffset] = useState(0)
  const week = useMemo(() => weekBounds(offset), [offset])
  const month = useMemo(() => monthBounds(0), [])
  const [selectedDay, setSelectedDay] = useState(todayMadrid())
  const [editing, setEditing] = useState(null) // { emp, date }

  const emp = useData(listEmployees, [])
  const shifts = useData(() => listShifts(week.startStr, week.endStr), [week.startStr])
  const weekEntries = useData(() => rangeTimeEntries(week.startStr, week.endStr), [week.startStr])
  const monthEntries = useData(() => rangeTimeEntries(month.startStr, month.endStr), [month.startStr])
  const schedWeek = useData(() => getScheduleWeek(week.startStr), [week.startStr], { interval: 0 })

  useEffect(() => {
    setSelectedDay(week.days.includes(todayMadrid()) ? todayMadrid() : week.days[0])
  }, [week.startStr]) // eslint-disable-line

  const staff = (emp.data || []).filter((e) => e.role !== 'admin')
  const empById = useMemo(() => new Map((emp.data || []).map((e) => [e.id, e])), [emp.data])
  const staffByRole = useMemo(() => {
    const m = {}
    for (const e of staff) (m[e.role] ||= []).push(e)
    return m
  }, [emp.data])

  // empId -> date -> shifts[]
  const shiftsByEmpDay = useMemo(() => {
    const m = new Map()
    for (const s of shifts.data || []) {
      if (!m.has(s.employee_id)) m.set(s.employee_id, new Map())
      const days = m.get(s.employee_id)
      if (!days.has(s.work_date)) days.set(s.work_date, [])
      days.get(s.work_date).push(s)
    }
    return m
  }, [shifts.data])

  const dayShifts = (shifts.data || []).filter((s) => s.work_date === selectedDay).sort((a, b) => toMin(a.start_time) - toMin(b.start_time))
  const weekWorked = useMemo(() => workedMinutesByEmployee(weekEntries.data || []), [weekEntries.data])
  const monthWorked = useMemo(() => workedMinutesByEmployee(monthEntries.data || []), [monthEntries.data])

  const published = schedWeek.data?.status === 'published'
  const showSchedule = editable || published
  const loading = emp.loading || shifts.loading

  async function togglePublish() {
    try {
      if (published) { await unpublishWeek(week.startStr); toast('Semana en borrador'); haptic('warning') }
      else { await publishWeek(week.startStr, employee.id); toast('Semana publicada ✓'); haptic('success') }
      await schedWeek.reload(true)
    } catch { toast('No se pudo actualizar', 'error') }
  }

  // Horas: cada empleado ve solo las suyas; el admin ve todo el equipo.
  const hoursStaff = editable ? [...staff] : staff.filter((e) => e.id === employee.id)

  return (
    <div className="space-y-5 pb-24">
      {/* Navegación de semana */}
      <div className="flex items-center justify-between">
        <button onClick={() => setOffset((o) => o - 1)} aria-label="Semana anterior" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 active:scale-90">
          <Chevron size={20} className="rotate-180 text-ink/60" />
        </button>
        <div className="flex flex-col items-center text-ink">
          <span className="flex items-center gap-1.5 font-display text-lg font-extrabold"><Calendar size={16} className="text-bronze-dark" />{week.label}</span>
          {editable ? (
            <button onClick={togglePublish} className="mt-0.5 active:scale-95">
              <Pill color={published ? 'sage' : 'ochre'}>{published ? 'Publicado · pulsa para retirar' : 'Borrador · pulsar para publicar'}</Pill>
            </button>
          ) : (
            published && <Pill color="sage" className="mt-0.5">Publicado</Pill>
          )}
        </div>
        <button onClick={() => setOffset((o) => o + 1)} aria-label="Semana siguiente" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 active:scale-90">
          <Chevron size={20} className="text-ink/60" />
        </button>
      </div>

      {loading ? (
        <SkeletonList rows={6} />
      ) : !showSchedule ? (
        <EmptyState icon={Lock} title="Horario no publicado" subtitle="El horario de esta semana aún no está disponible. Te avisaremos cuando se publique." />
      ) : (
        <>
          <WeekGrid
            staffByRole={staffByRole}
            days={week.days}
            shiftsByEmpDay={shiftsByEmpDay}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            employee={employee}
            editable={editable}
            onCellTap={(e, d) => setEditing({ emp: e, date: d })}
          />
          {editable && <p className="-mt-2 px-1 text-xs text-ink/40">Toca una casilla para asignar o editar turnos. Las horas sin nadie = gimnasio cerrado.</p>}

          <div>
            <SectionTitle icon={Clock}>{parseDate(selectedDay).getDate()} {parseDate(selectedDay).toLocaleDateString('es-ES', { month: 'long' })} · cobertura por horas</SectionTitle>
            <DayTimeline day={selectedDay} dayShifts={dayShifts} empById={empById} />
          </div>
        </>
      )}

      {/* Horas trabajadas (privadas por empleado) */}
      <div>
        <SectionTitle icon={User}>{editable ? 'Horas trabajadas del equipo' : 'Mis horas trabajadas'}</SectionTitle>
        <Card className="divide-y divide-ink/[0.06]">
          {hoursStaff
            .map((e) => ({ e, w: weekWorked.get(e.id) || 0, m: monthWorked.get(e.id) || 0 }))
            .sort((a, b) => b.w - a.w)
            .map(({ e, w, m }, i) => {
              const isMe = e.id === employee.id
              return (
                <div key={e.id} className={`flex animate-rise-in items-center gap-3 p-3 ${isMe ? 'bg-bronze/[0.05]' : ''}`} style={{ animationDelay: `${i * 35}ms` }}>
                  <Avatar emp={e} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{e.name}{isMe && <span className="ml-1 text-xs font-bold text-bronze-dark">· tú</span>}</p>
                    <p className="text-xs text-ink/40">Mes: <span className="tabular">{fmtMinutes(m)}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-extrabold text-ink tabular">{fmtMinutes(w)}</p>
                    <p className="text-[10px] text-ink/40">esta semana</p>
                  </div>
                </div>
              )
            })}
        </Card>
        <p className="mt-2 px-1 text-xs text-ink/40">Calculado de los fichajes (descontando pausas y comidas).</p>
      </div>

      {editable && (
        <ShiftEditor
          state={editing}
          shifts={(shiftsByEmpDay.get(editing?.emp?.id)?.get(editing?.date) || [])}
          onClose={() => setEditing(null)}
          onChanged={() => shifts.reload(true)}
          createdBy={employee.id}
          toast={toast}
        />
      )}
    </div>
  )
}

// ------- Editor de turnos del día (varias franjas + puesto) -------
function PuestoChips({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PUESTOS.map((p) => (
        <button key={p} onClick={() => onChange(value === p ? null : p)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${value === p ? 'bg-bronze text-white' : 'bg-ink/5 text-ink/60'}`}>
          {p}
        </button>
      ))}
    </div>
  )
}

function FranjaRow({ shift, onChanged, toast }) {
  const [start, setStart] = useState(shift.start_time.slice(0, 5))
  const [end, setEnd] = useState(shift.end_time.slice(0, 5))
  const [puesto, setPuesto] = useState(shift.puesto || null)
  const [busy, setBusy] = useState(false)
  const dirty = start !== shift.start_time.slice(0, 5) || end !== shift.end_time.slice(0, 5) || (puesto || null) !== (shift.puesto || null)

  const inp = 'rounded-xl border border-ink/10 bg-white px-2 py-2 text-base font-semibold tabular outline-none focus:border-bronze'

  async function save() {
    if (end <= start) { toast('La salida debe ser posterior', 'error'); return }
    setBusy(true)
    try { await updateShift(shift.id, { start_time: start, end_time: end, puesto }); haptic('success'); toast('Turno guardado ✓'); await onChanged() }
    catch { toast('No se pudo guardar', 'error') } finally { setBusy(false) }
  }
  async function remove() {
    setBusy(true)
    try { await deleteShift(shift.id); haptic('warning'); toast('Franja eliminada'); await onChanged() }
    catch { toast('No se pudo eliminar', 'error') } finally { setBusy(false) }
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-3">
      <div className="mb-2 flex items-center gap-2">
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`${inp} flex-1`} />
        <span className="text-ink/30">→</span>
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={`${inp} flex-1`} />
        <button onClick={remove} disabled={busy} aria-label="Quitar franja" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-terracotta active:scale-90">
          <Trash size={16} />
        </button>
      </div>
      <PuestoChips value={puesto} onChange={setPuesto} />
      {dirty && (
        <button onClick={save} disabled={busy} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-sage py-2 text-sm font-bold text-white active:scale-95">
          <Check size={16} /> Guardar cambios
        </button>
      )}
    </div>
  )
}

function ShiftEditor({ state, shifts, onClose, onChanged, createdBy, toast }) {
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('14:00')
  const [puesto, setPuesto] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { setStart('09:00'); setEnd('14:00'); setPuesto(null) }, [state])
  if (!state) return null

  async function add() {
    if (end <= start) { toast('La salida debe ser posterior', 'error'); return }
    setBusy(true)
    try {
      await createShift({ employee_id: state.emp.id, work_date: state.date, start_time: start, end_time: end, puesto, created_by: createdBy })
      haptic('success'); toast('Franja añadida ✓'); await onChanged()
      setStart(end); setEnd('22:00'); setPuesto(null)
    } catch { toast('No se pudo añadir', 'error') } finally { setBusy(false) }
  }

  const inp = 'rounded-xl border border-ink/10 bg-white px-2 py-2 text-base font-semibold tabular outline-none focus:border-bronze'

  return (
    <Sheet open={!!state} onClose={onClose} title="Turnos del día">
      <div className="mb-4 flex items-center gap-3">
        <Avatar emp={state.emp} size={36} />
        <div>
          <p className="font-display text-xl font-bold">{state.emp.name}</p>
          <p className="text-sm text-ink/45 capitalize">{parseDate(state.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {shifts.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-ink/40">Franjas asignadas</p>
          {shifts.map((s) => <FranjaRow key={s.id} shift={s} onChanged={onChanged} toast={toast} />)}
        </div>
      )}

      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/40">Añadir franja</p>
      <div className="mb-2 flex items-center gap-2">
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={`${inp} flex-1`} />
        <span className="text-ink/30">→</span>
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={`${inp} flex-1`} />
      </div>
      <div className="mb-4"><PuestoChips value={puesto} onChange={setPuesto} /></div>
      <button onClick={add} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-base font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50">
        <Plus size={20} /> Añadir franja
      </button>
    </Sheet>
  )
}
