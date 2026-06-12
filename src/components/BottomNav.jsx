import { haptic } from '../lib/haptics'

// Píldora de navegación flotante (admin y coach). Desplazable si hay muchas pestañas.
export default function BottomNav({ tabs, active, onChange }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-3"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      aria-label="Navegación principal"
    >
      <div className="glass overflow-hidden rounded-xl3 bg-ink/[0.92] shadow-float ring-1 ring-white/[0.08]">
        <div className="no-scrollbar flex overflow-x-auto px-1.5 py-1.5">
          {tabs.map((t) => {
            const Icon = t.icon
            const on = active === t.key
            return (
              <button
                key={t.key}
                onClick={() => { if (!on) haptic('tap'); onChange(t.key) }}
                aria-current={on ? 'page' : undefined}
                className={`relative flex min-w-[62px] flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10.5px] font-bold transition-enter ${
                  on ? 'bg-white/[0.07] text-bronze-glow' : 'text-white/40'
                }`}
              >
                {/* Indicador de pestaña activa: no depende solo del color (skill color-not-only / nav-state-active) */}
                <span
                  className={`absolute top-0.5 h-1 w-1 rounded-full bg-bronze-glow transition-enter ${
                    on ? 'opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden="true"
                />
                <Icon size={22} strokeWidth={on ? 2.2 : 1.8} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
