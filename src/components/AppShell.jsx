import { useState } from 'react'
import { Wordmark } from './Logo'
import { useSession } from '../state/session'
import { greetingMadrid, longDateMadrid } from '../lib/date'
import { LogOut, Calendar, Book, Megaphone } from './icons'
import UtilitiesOverlay from './UtilitiesOverlay'
import AccountSheet from './AccountSheet'
import { Avatar } from './ui'

const ROLE_LABEL = {
  admin: 'Administración',
  coach: 'Coach',
  cleaning: 'Limpieza',
  maintenance: 'Mantenimiento',
}

// Cabecera oscura con logo de marca + identidad del usuario simulado.
// La luz cálida bronce (brand-glow) evoca el logo proyectado sobre la pared del club.
export function Header({ subtitle, onCalendar, onAnnounce }) {
  const { employee, logout } = useSession()
  const [utils, setUtils] = useState(false)
  const [account, setAccount] = useState(false)
  return (
    <header className="relative overflow-hidden bg-ink px-5 pb-5 pt-safe text-white">
      <div className="brand-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative flex items-center justify-between pt-4">
        <Wordmark variant="white" className="h-5 w-auto" />
        <div className="flex items-center gap-2">
          {onAnnounce && (
            <button
              onClick={onAnnounce}
              aria-label="Aviso a coaches"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-enter active:scale-95"
            >
              <Megaphone size={14} /> Aviso
            </button>
          )}
          {onCalendar && (
            <button
              onClick={onCalendar}
              aria-label="Ver horarios"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-enter active:scale-95"
            >
              <Calendar size={14} /> Horarios
            </button>
          )}
          <button
            onClick={() => setUtils(true)}
            aria-label="Utilidades y manuales"
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-enter active:scale-95"
          >
            <Book size={14} /> Utilidades
          </button>
          <button
            onClick={() => setAccount(true)}
            aria-label="Mi cuenta y ajustes"
            className="rounded-full ring-2 ring-white/15 transition-enter active:scale-95"
          >
            <Avatar emp={employee} size={32} />
          </button>
          <button
            onClick={logout}
            aria-label="Cambiar de usuario"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-enter active:scale-95"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
      {utils && <UtilitiesOverlay onClose={() => setUtils(false)} />}
      <AccountSheet open={account} onClose={() => setAccount(false)} employee={employee} />
      <div className="relative mt-4">
        <p className="text-sm text-white/50">{greetingMadrid()}, {employee.name.split(' ')[0]}</p>
        <h1 className="font-display text-3xl font-extrabold leading-tight">
          {subtitle || ROLE_LABEL[employee.role]}
        </h1>
        <p className="mt-0.5 text-sm capitalize text-bronze">{longDateMadrid()}</p>
      </div>
    </header>
  )
}

// Botón de acción flotante (esquina inferior derecha).
// Sin `label` se renderiza como un círculo "+" igual que el de la vista coach.
export function Fab({ icon: Icon, label, ariaLabel, onClick, tone = 'bronze' }) {
  const tones = {
    bronze: 'bg-bronze',
    ink: 'bg-ink',
    terracotta: 'bg-terracotta',
  }
  const circular = !label
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || label}
      className={`fixed bottom-5 right-5 z-30 flex items-center justify-center gap-2 rounded-full ${tones[tone]} text-white shadow-float transition-enter active:scale-90 ${
        circular ? 'h-16 w-16' : 'px-5 py-4 font-bold'
      }`}
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Icon size={circular ? 28 : 22} />
      {label && <span className="pr-1">{label}</span>}
    </button>
  )
}

export function Screen({ children }) {
  return <div className="min-h-dvh bg-sand pb-28">{children}</div>
}
