import { useMemo, useRef, useState, useEffect } from 'react'
import { listEmployees, listShifts, rangeTimeEntries, upsertShift, deleteShift } from '../lib/api'
import { useData } from '../lib/useData'
import { useSession } from '../state/session'
import { useToast } from '../components/Toast'
import { Card, SectionTitle, Spinner } from '../components/ui'
import Sheet from '../components/Sheet'
import { Chevron, Calendar, Clock, Trash, User } from '../components/icons'
import { monthBounds, dowLabel, parseDate, isTodayStr, todayMadrid } from '../lib/date'
import { workedMinutesByEmployee, fmtMinutes } from '../lib/hours'

const ROLE_LABEL = { coach: 'Coach', cleaning: 'Limpieza', maintenance: 'Mant.', admin: 'Admin' }

function Avatar({ emp, size = 36 }) {
  const initials = emp.name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full font-display font-extrabold text-white"
      style={{ background: emp.color, width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </span>
  )
}

const shiftMinutes = (s) => {
  const [h1, m1] = s.start_time.split(':').map(Number)
  const [h2, m2] = s.end_time.split(':').map(Number)
  return (h2 * 60 + m2) - (h1 * 60 + m1)
}
const hhmm = (t) => (t ? t.slice(0, 5) : '')

export default function ScheduleScreen({ editable = false }) {
  const { employee } = useSession()
  const toast = useToast()
  const [offset, setOffset] = useState(0)
  const month = useMemo(() => monthBounds(offset), [offset])
  const [selected, setSelected] = useState(() => (monthBounds(0).days.includes(todayMadrid()) ? todayMadrid() : monthBounds(0).days[0]))

  const emp = useData(listEmployees, [])
  const shifts = useData(() => listShifts(month.startStr, month.endStr), [month.startStr])
  const entries = useData(() => rangeTimeEntries(month.startStr, month.endStr), [month.startStr])

  const [editing, setEditing] = useState(null) // { emp, date, shift }
  const stripRef = useRef(null)

  // Al cambiar de mes, situar el día seleccionado dentro del mes.
  useEffect(() => {
    setSelected(month.days.includes(todayMadrid()) ? todayMadrid() : month.days[0])
  }, [month.startStr]) // eslint-disable-line

  const staff = (emp.data || []).filter((e) => e.role !== 'admin')
  const shiftsByDate = useMemo(() => {
    const m = new Map()
    for (const s of shifts.data || []) {
      if (!m.has(s.work_date)) m.set(s.work_date, new Map())
      m.get(s.work_date).set(s.employee_id, s)
    }
    return m
  }, [shifts.data])

  const worked = useMemo(() => workedMinutesByEmployee(entries.data || []), [entries.data])

  const daySel = shiftsByDate.get(selected) || new Map()
  const dayRows = staff.map((e) => ({ emp: e, shift: daySel.get(e.id) || null })).sort((a, b) => (b.shift ? 1 : 0) - (a.shift ? 1 : 0))

  const loading = emp.loading || shifts.loading

  return (
    <div className="space-y-5 pb-24">
      {/* Navegación de mes */}
      <div className="flex items-center justify-between">
        <button onClick={() => setOffset((o) => o - 1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 active:scale-90">
          <Chevron size={20} className="rotate-180 text-ink/60" />
        </button>
        <div className="flex items-center gap-2 text-ink">
          <Calendar size={18} className="text-bronze-dark" />
          <span className="font-display text-xl font-extrabold">{month.label}</span>
        </div>
        <button onClick={() => setOffset((o) => o + 1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 active:scale-90">
          <Chevron size={20} className="text-ink/60" />
        </button>
      </div>

      {/* Tira de días */}
      <div ref={stripRef} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {month.days.map((d) => {
          const has = shiftsByDate.get(d)?.size > 0
          const mine = shiftsByDate.get(d)?.has(employee.id)
          const sel = d === selected
          const today = isTodayStr(d)
          return (
            <button key={d} onClick={() => setSelected(d)}
              className={`flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border transition active:scale-95 ${
                sel ? 'border-ink bg-ink text-white' : today ? 'border-bronze bg-white text-ink' : 'border-transparent bg-white text-ink'
              }`}>
              <span className={`text-[10px] font-bold ${sel ? 'text-white/60' : 'text-ink/40'}`}>{dowLabel(d)}</span>
              <span className="font-display text-lg font-extrabold leading-none">{parseDate(d).getDate()}</span>
              <span className={`mt-1 h-1.5 w-1.5 rounded-full ${mine ? (sel ? 'bg-bronze' : 'bg-bronze') : has ? (sel ? 'bg-white/40' : 'bg-ink/15') : 'bg-transparent'}`} />
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner className="h-7 w-7" /></div>
      ) : (
        <>
          {/* Turnos del día seleccionado */}
          <div>
            <SectionTitle icon={Clock}>Turnos · {parseDate(selected).getDate()} {month.label.split(' ')[0].toLowerCase()}</SectionTitle>
            <Card className="divide-y divide-ink/[0.06]">
              {dayRows.map(({ emp: e, shift }) => {
                const isMe = e.id === employee.id
                return (
                  <button
                    key={e.id}
                    onClick={() => editable && setEditing({ emp: e, date: selected, shift })}
                    disabled={!editable}
                    className={`flex w-full items-center gap-3 p-3 text-left ${editable ? 'active:bg-ink/[0.03]' : ''} ${isMe ? 'bg-bronze/[0.06]' : ''}`}
                  >
                    <Avatar emp={e} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{e.name}{isMe && <span className="ml-1 text-xs font-bold text-bronze-dark">· tú</span>}</p>
                      <p className="text-xs text-ink/40">{ROLE_LABEL[e.role]}</p>
                    </div>
                    {shift ? (
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-ink">{hhmm(shift.start_time)}–{hhmm(shift.end_time)}</p>
                        <p className="text-xs text-ink/40">{fmtMinutes(shiftMinutes(shift))}</p>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-ink/30">{editable ? '+ asignar' : 'libra'}</span>
                    )}
                  </button>
                )
              })}
            </Card>
          </div>

          {/* Horas trabajadas del mes */}
          <div>
            <SectionTitle icon={User}>Horas trabajadas · {month.label}</SectionTitle>
            <Card className="divide-y divide-ink/[0.06]">
              {[...staff]
                .map((e) => ({ emp: e, min: worked.get(e.id) || 0 }))
                .sort((a, b) => b.min - a.min)
                .map(({ emp: e, min }) => {
                  const isMe = e.id === employee.id
                  return (
                    <div key={e.id} className={`flex items-center gap-3 p-3 ${isMe ? 'bg-bronze/[0.06]' : ''}`}>
                      <Avatar emp={e} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{e.name}{isMe && <span className="ml-1 text-xs font-bold text-bronze-dark">· tú</span>}</p>
                      </div>
                      <p className="font-display text-xl font-extrabold text-ink">{fmtMinutes(min)}</p>
                    </div>
                  )
                })}
            </Card>
            <p className="mt-2 px-1 text-xs text-ink/40">Acumulado desde el día 1 del mes, según los fichajes (descontando pausas y comidas).</p>
          </div>
        </>
      )}

      {editable && (
        <ShiftEditor
          state={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { await shifts.reload(true) }}
          createdBy={employee.id}
          toast={toast}
        />
      )}
    </div>
  )
}

function ShiftEditor({ state, onClose, onSaved, createdBy, toast }) {
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('17:00')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (state?.shift) { setStart(hhmm(state.shift.start_time)); setEnd(hhmm(state.shift.end_time)) }
    else { setStart('09:00'); setEnd('17:00') }
  }, [state])

  if (!state) return null
  const input = 'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-lg font-semibold outline-none focus:border-bronze'

  async function save() {
    if (end <= start) { toast('La salida debe ser posterior a la entrada', 'error'); return }
    setBusy(true)
    try {
      await upsertShift({ employee_id: state.emp.id, work_date: state.date, start_time: start, end_time: end, created_by: createdBy })
      toast('Turno guardado ✓'); await onSaved(); onClose()
    } catch { toast('No se pudo guardar', 'error') } finally { setBusy(false) }
  }
  async function clear() {
    setBusy(true)
    try { await deleteShift(state.emp.id, state.date); toast('Turno eliminado'); await onSaved(); onClose() }
    catch { toast('No se pudo eliminar', 'error') } finally { setBusy(false) }
  }

  return (
    <Sheet open={!!state} onClose={onClose} title={state.shift ? 'Editar turno' : 'Asignar turno'}>
      <div className="mb-4 flex items-center gap-3">
        <Avatar emp={state.emp} />
        <div>
          <p className="font-display text-xl font-bold">{state.emp.name}</p>
          <p className="text-sm text-ink/45">{parseDate(state.date).getDate()} · {dowLabel(state.date)}</p>
        </div>
      </div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40">Entrada</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={input} />
        </div>
        <span className="mt-6 text-ink/30">→</span>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40">Salida</label>
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={input} />
        </div>
      </div>
      <button onClick={save} disabled={busy} className="w-full rounded-2xl bg-ink py-4 text-lg font-extrabold text-white transition active:scale-[0.98] disabled:opacity-50">
        Guardar turno
      </button>
      {state.shift && (
        <button onClick={clear} disabled={busy} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-terracotta active:scale-95">
          <Trash size={16} /> Quitar turno
        </button>
      )}
    </Sheet>
  )
}
