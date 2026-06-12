import { useEffect, useState } from 'react'
import { Plus } from './icons'
import { haptic } from '../lib/haptics'

// FAB con menú radial: un botón "+" que despliega varias acciones etiquetadas.
export default function SpeedDial({ actions, tone = 'bronze', bottom = 'bottom-20' }) {
  const [open, setOpen] = useState(false)
  const tones = {
    bronze: 'bg-gradient-to-br from-bronze-glow to-bronze-dark',
    ink: 'bg-gradient-to-br from-ink-soft to-ink',
    terracotta: 'bg-terracotta',
  }

  // Cierre con tecla Esc (skill §9 modal-escape)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {open && <div className="glass fixed inset-0 z-30 animate-fade-in bg-ink/35" onClick={() => setOpen(false)} />}
      <div
        className={`fixed ${bottom} right-5 z-40 flex flex-col items-end gap-3`}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {open &&
          actions.map((a, i) => {
            const Icon = a.icon
            const t = tones[a.tone] || tones.bronze
            return (
              <button
                key={a.label}
                onClick={() => { haptic('tap'); setOpen(false); a.onClick() }}
                aria-label={a.label}
                className="flex items-center gap-3 animate-rise-in"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <span className="glass rounded-xl bg-ink/85 px-3.5 py-2 text-sm font-bold text-white shadow-float ring-1 ring-white/10">{a.label}</span>
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${t} text-white shadow-float ring-1 ring-white/20`}>
                  <Icon size={22} />
                </span>
              </button>
            )
          })}
        <button
          onClick={() => { haptic('tap'); setOpen((v) => !v) }}
          aria-label={open ? 'Cerrar menú de acciones' : 'Abrir menú de acciones'}
          aria-expanded={open}
          className={`flex h-16 w-16 items-center justify-center rounded-full ${tones[tone]} text-white shadow-glow ring-1 ring-white/25 transition-enter active:scale-90`}
        >
          <span className={`transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>
            <Plus size={28} />
          </span>
        </button>
      </div>
    </>
  )
}
