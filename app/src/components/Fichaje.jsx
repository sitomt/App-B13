import { useEffect, useState } from 'react'
import { addTimeEntry, deriveStatus, todayEntries } from '../lib/api'
import { useData } from '../lib/useData'
import { timeHM } from '../lib/date'
import { fmtMinutes, workedMinutesForDay } from '../lib/hours'
import { ConfirmSheet } from './ui'
import { useToast } from './Toast'
import { Power, Coffee, Utensils, Clock, LogOut } from './icons'

const STATUS_META = {
  out: { label: 'Sin fichar', color: 'text-ink/40', dot: 'bg-ink/25' },
  working: { label: 'En turno', color: 'text-sage', dot: 'bg-sage' },
  break: { label: 'En pausa', color: 'text-ochre', dot: 'bg-ochre' },
  meal: { label: 'En comida', color: 'text-stone', dot: 'bg-stone' },
}

// Cronómetro en vivo del turno (HH:MM:SS), descontando pausas/comidas como en hours.js.
function elapsedMs(entries, now) {
  if (!entries || entries.length === 0) return 0
  const sorted = [...entries].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
  const t = (e) => new Date(e.occurred_at).getTime()
  const ci = sorted.find((e) => e.kind === 'clock_in')
  if (!ci) return 0
  const co = [...sorted].reverse().find((e) => e.kind === 'clock_out')
  const start = t(ci)
  const end = co ? t(co) : now
  if (end <= start) return 0
  let paused = 0, open = null
  for (const e of sorted) {
    if (e.kind === 'break_start' || e.kind === 'meal_start') open = t(e)
    if ((e.kind === 'break_end' || e.kind === 'meal_end') && open != null) { paused += Math.max(0, t(e) - open); open = null }
  }
  if (open != null) paused += Math.max(0, end - open)
  return Math.max(0, end - start - paused)
}

function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const p = (n) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

function ActionBtn({ icon: Icon, label, onClick, tone = 'ink', disabled }) {
  const tones = {
    ink: 'bg-ink text-white',
    sage: 'bg-sage text-white',
    ochre: 'bg-ochre/15 text-[#8a6a1e]',
    stone: 'bg-stone/15 text-stone',
    ghost: 'bg-ink/5 text-ink/70',
    danger: 'bg-terracotta/12 text-terracotta',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-3 text-[13px] font-bold transition active:scale-95 disabled:opacity-50 ${tones[tone]}`}
    >
      <Icon size={22} />
      {label}
    </button>
  )
}

export default function Fichaje({ employee, onChange }) {
  const { data: entries, reload } = useData(() => todayEntries(employee.id), [employee.id], { interval: 60000 })
  const [busy, setBusy] = useState(false)
  const [confirmOut, setConfirmOut] = useState(false)
  const [now, setNow] = useState(Date.now())
  const toast = useToast()

  const status = deriveStatus(entries || [])
  const clockInEntry = (entries || []).find((e) => e.kind === 'clock_in')
  const finished = status === 'out' && clockInEntry // ya fichó entrada hoy y salió
  const meta = finished
    ? { label: 'Jornada terminada', color: 'text-white/70', dot: 'bg-white/40' }
    : STATUS_META[status]

  // Ticker de segundos solo mientras el turno está activo (no malgasta renders parado).
  useEffect(() => {
    if (status === 'out') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [status])

  const live = status === 'working' || status === 'break' || status === 'meal'
  const worked = live ? fmtClock(elapsedMs(entries || [], now)) : null
  const finishedTotal = finished ? fmtMinutes(workedMinutesForDay(entries || [])) : null

  async function act(kind, msg) {
    if (busy) return
    setBusy(true)
    try {
      await addTimeEntry(employee.id, kind)
      await reload(true)
      onChange?.()
      toast(msg)
    } catch {
      toast('No se pudo fichar', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl2 bg-ink p-4 text-white shadow-card">
      <div className="brand-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${meta.dot} ${status !== 'out' ? 'animate-pulse' : ''}`} />
          <span className="font-display text-xl font-bold">{meta.label}</span>
        </div>
        {clockInEntry && (
          <span className="flex items-center gap-1 text-xs text-white/55">
            <Clock size={13} /> entrada {timeHM(clockInEntry.occurred_at)}
          </span>
        )}
      </div>

      {/* Cronómetro en vivo del turno: lo que el empleado mira de un vistazo */}
      {(worked || finishedTotal) && (
        <div className="relative mb-3 flex items-baseline gap-2">
          <span className="tabular font-display text-4xl font-extrabold leading-none tracking-tight">
            {worked || finishedTotal}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-white/45">
            {status === 'break' ? 'pausa en curso' : status === 'meal' ? 'comida en curso' : finished ? 'trabajadas hoy' : 'en turno'}
          </span>
        </div>
      )}

      {status === 'out' && (
        <button
          onClick={() => act('clock_in', 'Entrada fichada')}
          disabled={busy}
          className={`relative flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-extrabold transition-enter active:scale-95 disabled:opacity-50 ${
            finished ? 'bg-white/10 text-base text-white/80' : 'bg-sage text-lg text-white'
          }`}
        >
          <Power size={24} /> {finished ? 'Volver a fichar entrada' : 'Fichar entrada'}
        </button>
      )}

      {status === 'working' && (
        <div className="relative flex gap-2">
          <ActionBtn icon={Coffee} label="Pausa" tone="ochre" onClick={() => act('break_start', 'Pausa iniciada')} disabled={busy} />
          <ActionBtn icon={Utensils} label="Comida" tone="stone" onClick={() => act('meal_start', 'Comida iniciada')} disabled={busy} />
          <ActionBtn icon={LogOut} label="Salir" tone="danger" onClick={() => setConfirmOut(true)} disabled={busy} />
        </div>
      )}

      {status === 'break' && (
        <button
          onClick={() => act('break_end', 'De vuelta al turno')}
          disabled={busy}
          className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-extrabold text-ink transition-enter active:scale-95 disabled:opacity-50"
        >
          <Power size={24} /> Terminar pausa
        </button>
      )}

      {status === 'meal' && (
        <button
          onClick={() => act('meal_end', 'De vuelta al turno')}
          disabled={busy}
          className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-lg font-extrabold text-ink transition-enter active:scale-95 disabled:opacity-50"
        >
          <Power size={24} /> Terminar comida
        </button>
      )}

      <ConfirmSheet
        open={confirmOut}
        onClose={() => setConfirmOut(false)}
        onConfirm={() => act('clock_out', 'Salida fichada')}
        title="¿Fichar salida?"
        message="Se cerrará tu jornada de hoy. Si aún no has terminado, puedes seguir en turno."
        confirmLabel="Fichar salida"
        tone="danger"
      />
    </div>
  )
}
