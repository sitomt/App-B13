import { haptic } from '../lib/haptics'

// Barra de pestañas inferior reutilizable (admin y coach). Desplazable si hay muchas.
export default function BottomNav({ tabs, active, onChange }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-ink/10 bg-sand-50/95 backdrop-blur"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.4rem)' }}
      aria-label="Navegación principal"
    >
      <div className="no-scrollbar flex overflow-x-auto px-2 pt-2">
        {tabs.map((t) => {
          const Icon = t.icon
          const on = active === t.key
          return (
            <button
              key={t.key}
              onClick={() => { if (!on) haptic('tap'); onChange(t.key) }}
              aria-current={on ? 'page' : undefined}
              className={`relative flex min-w-[64px] flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-bold transition-enter ${
                on ? 'text-ink' : 'text-ink/35'
              }`}
            >
              {/* Indicador de pestaña activa: no depende solo del color (skill color-not-only / nav-state-active) */}
              <span
                className={`absolute -top-px h-0.5 rounded-full bg-bronze transition-enter ${
                  on ? 'w-7 opacity-100' : 'w-0 opacity-0'
                }`}
                aria-hidden="true"
              />
              <Icon size={22} strokeWidth={on ? 2.2 : 1.8} />
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
