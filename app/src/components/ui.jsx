import { useEffect } from 'react'
import Sheet from './Sheet'

export function Card({ className = '', children, ...p }) {
  return (
    <div className={`rounded-xl2 bg-white shadow-card ${className}`} {...p}>
      {children}
    </div>
  )
}

// Placeholder con shimmer para cargas >300ms (skill §3 progressive-loading).
// Reserva el espacio para evitar saltos de layout (CLS).
export function Skeleton({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-ink/[0.06] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    </div>
  )
}

// Esqueleto de tarjeta de tarea (imita la fila real para una transición sin salto).
export function SkeletonList({ rows = 4 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="h-24 w-full rounded-xl2" />
      <div className="divide-y divide-ink/[0.06] rounded-xl2 bg-white shadow-card">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Diálogo de confirmación para acciones sensibles (skill §8 confirmation-dialogs).
// Reutiliza el bottom-sheet de marca; separa la acción destructiva visualmente.
export function ConfirmSheet({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', tone = 'ink' }) {
  const tones = {
    ink: 'bg-ink text-white',
    danger: 'bg-terracotta text-white',
    sage: 'bg-sage text-white',
  }
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {message && <p className="px-1 pb-5 text-[15px] leading-relaxed text-ink/65">{message}</p>}
      <div className="flex gap-3 pb-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-2xl bg-ink/5 py-3.5 font-bold text-ink/70 transition-enter active:scale-95"
        >
          Cancelar
        </button>
        <button
          onClick={() => { onConfirm(); onClose() }}
          className={`flex-1 rounded-2xl py-3.5 font-extrabold transition-enter active:scale-95 ${tones[tone]}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  )
}

export function Spinner({ className = '' }) {
  return (
    <div className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-ink/15 border-t-ink/70 ${className}`} />
  )
}

export function FullLoader({ label = 'Cargando…' }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 text-ink/50">
      <Spinner className="h-7 w-7" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

// Etiqueta de estado / categoría
export function Pill({ color = 'ink', children, className = '' }) {
  const map = {
    ink: 'bg-ink/8 text-ink',
    sage: 'bg-sage/15 text-sage',
    terracotta: 'bg-terracotta/15 text-terracotta',
    ochre: 'bg-ochre/20 text-[#8a6a1e]',
    stone: 'bg-stone/15 text-stone',
    bronze: 'bg-bronze/15 text-bronze-dark',
    white: 'bg-white/15 text-white',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[color]} ${className}`}>
      {children}
    </span>
  )
}

// Anillo de progreso (para % de agenda). Al llegar al 100% vira a sage y
// emite un destello de celebración (skill §7 motion-meaning; gamificación positiva).
export function ProgressRing({ value, size = 56, stroke = 6, color = '#B98A5E', track = '#E9E3D9', children }) {
  const v = Math.min(1, Math.max(0, value))
  const complete = v >= 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (v * c)
  const strokeColor = complete ? '#5E8C61' : color
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {complete && (
        <span className="absolute inset-0 animate-flash rounded-full bg-sage/40" aria-hidden="true" />
      )}
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={strokeColor} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .5s ease, stroke .4s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

export function SectionTitle({ icon: Icon, children, right }) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <div className="flex items-center gap-2 text-ink/70">
        {Icon && <Icon size={18} />}
        <h2 className="font-display text-xl font-bold tracking-tight">{children}</h2>
      </div>
      {right}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-ink/15 py-8 text-center text-ink/40">
      {Icon && <Icon size={26} />}
      <p className="text-sm font-semibold text-ink/55">{title}</p>
      {subtitle && <p className="px-8 text-xs">{subtitle}</p>}
    </div>
  )
}

// Bloquea el scroll del body mientras hay un modal/sheet abierto
export function useLockBody(active) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [active])
}
