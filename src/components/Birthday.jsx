import { useState, useEffect } from 'react'
import { listEmployees } from '../lib/api'
import { useData } from '../lib/useData'
import { useSession } from '../state/session'
import { isBirthdayToday, todayMadrid } from '../lib/date'
import { haptic } from '../lib/haptics'
import { Wordmark } from './Logo'

const firstName = (n) => (n || '').split(' ')[0]
const CONFETTI = ['🎉', '✨', '🎂', '🎈', '🎉', '✨', '🎈', '🎂']

// Overlay festivo para el propio cumpleañero. Aparece una vez al día al abrir
// la app (flag por usuario+fecha en localStorage).
export function BirthdayOverlay() {
  const { employee } = useSession()
  const { data: employees } = useData(listEmployees, [])
  const me = (employees || []).find((e) => e.id === employee?.id)
  const today = todayMadrid()
  const seenKey = me ? `b13.bday.seen.${me.id}.${today}` : null
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!me || !isBirthdayToday(me.birth_date)) { setShow(false); return }
    let seen = false
    try { seen = localStorage.getItem(seenKey) === '1' } catch { /* modo privado */ }
    if (!seen) { setShow(true); haptic('success') }
  }, [me?.id, me?.birth_date]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!show || !me) return null

  function close() {
    try { localStorage.setItem(seenKey, '1') } catch { /* modo privado */ }
    setShow(false)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-6 animate-fade-in backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-label="Felicitación de cumpleaños"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {CONFETTI.map((e, i) => (
          <span
            key={i}
            className="absolute animate-pop text-3xl"
            style={{ left: `${(i * 13 + 6) % 96}%`, top: `${(i * 11 + 5) % 88}%`, animationDelay: `${i * 90}ms` }}
          >
            {e}
          </span>
        ))}
      </div>

      <div
        className="brand-glow relative w-full max-w-xs rounded-3xl bg-ink p-7 text-center text-white shadow-float animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-6xl">🎂</div>
        <p className="font-display text-3xl font-extrabold leading-tight">¡Feliz cumpleaños, {firstName(me.name)}!</p>
        <p className="mt-4 text-sm text-white/65">De parte de todo el equipo de</p>
        <Wordmark variant="white" className="mx-auto mt-2 h-6 w-auto" />
        <p className="mt-3 text-base text-white/80">✨ Que pases un gran día ✨</p>
        <button
          onClick={close}
          className="mt-7 w-full rounded-2xl bg-bronze py-3.5 text-base font-extrabold text-white transition active:scale-95"
        >
          ¡Gracias!
        </button>
      </div>
    </div>
  )
}

// Tarjeta dentro de las vistas: si es mi cumple, felicitación persistente todo
// el día; si no, aviso pequeño del cumple de un compañero. Nada si no toca.
export function BirthdayNotice() {
  const { employee } = useSession()
  const { data: employees } = useData(listEmployees, [])
  const list = employees || []
  const me = list.find((e) => e.id === employee?.id)
  const myBday = me && isBirthdayToday(me.birth_date)
  const others = list.filter((e) => e.id !== employee?.id && isBirthdayToday(e.birth_date))

  if (myBday) {
    return (
      <div className="brand-glow flex items-center gap-3 rounded-xl2 bg-ink p-4 text-white shadow-card animate-rise-in">
        <span className="text-3xl">🎂</span>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-tight">¡Feliz cumpleaños, {firstName(me.name)}!</p>
          <p className="text-sm text-white/65">De parte de todo el equipo de Baktun 13 ✨</p>
        </div>
      </div>
    )
  }

  if (others.length > 0) {
    const names = others.map((e) => firstName(e.name))
    const label = names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
    return (
      <div className="flex items-center gap-2.5 rounded-xl2 bg-bronze/12 p-3.5 text-bronze-dark shadow-card animate-rise-in">
        <span className="shrink-0 text-xl">🎉</span>
        <p className="text-sm font-semibold">Hoy es el cumple de <span className="font-extrabold">{label}</span> — ¡felicítalo!</p>
      </div>
    )
  }

  return null
}
