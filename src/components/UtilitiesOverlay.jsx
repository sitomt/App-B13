import { useMemo, useState } from 'react'
import { Wordmark } from './Logo'
import { Card, EmptyState, useLockBody } from './ui'
import { Chevron, Book, Search } from './icons'
import { UTILITIES, UTILITIES_CATEGORIES } from '../data/utilities'

// Pantalla completa "Utilidades": manuales, políticas, accesos, contactos…
// Lectura para todos los roles. (El editor del admin llegará al conectar la BD.)
export default function UtilitiesOverlay({ onClose }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  useLockBody(true)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return UTILITIES
    return UTILITIES.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.body || '').toLowerCase().includes(q))
  }, [query])

  const groups = useMemo(() => {
    const cats = [...UTILITIES_CATEGORIES]
    for (const d of filtered) if (!cats.includes(d.category)) cats.push(d.category)
    return cats
      .map((c) => ({ category: c, docs: filtered.filter((d) => d.category === c) }))
      .filter((g) => g.docs.length > 0)
  }, [filtered])

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sand">
      <header className="sticky top-0 z-10 bg-ink px-5 pb-4 pt-safe text-white">
        <div className="relative flex items-center justify-between pt-4">
          <button onClick={selected ? () => setSelected(null) : onClose}
            className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold transition-enter active:scale-95">
            <Chevron size={16} className="rotate-180" /> {selected ? 'Utilidades' : 'Volver'}
          </button>
          <Wordmark variant="white" className="h-4 w-auto" />
        </div>
        {!selected && (
          <h1 className="mt-3 flex items-center gap-2 font-display text-2xl font-extrabold">
            <Book size={22} /> Utilidades
          </h1>
        )}
      </header>

      <div className="mx-auto max-w-md px-4 py-4">
        {selected ? (
          <article className="space-y-3">
            <span className="inline-block rounded-full bg-bronze/15 px-2.5 py-0.5 text-xs font-semibold text-bronze-dark">{selected.category}</span>
            <h2 className="font-display text-3xl font-extrabold leading-tight text-ink">{selected.title}</h2>
            <Card className="p-4">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink/80">{selected.body}</p>
            </Card>
          </article>
        ) : (
          <>
            {/* Buscador */}
            <div className="relative mb-5">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar manuales, políticas, accesos…"
                className="w-full rounded-2xl border border-ink/10 bg-white py-3 pl-11 pr-4 text-base outline-none focus:border-bronze"
              />
            </div>

            {groups.length === 0 ? (
              <EmptyState icon={Book} title="Sin resultados" subtitle="Prueba con otra búsqueda." />
            ) : (
              <div className="space-y-6">
                {groups.map((g) => (
                  <div key={g.category}>
                    <h2 className="mb-2 px-1 font-display text-lg font-bold text-ink/70">{g.category}</h2>
                    <div className="space-y-2">
                      {g.docs.map((d, i) => (
                        <button key={d.id} onClick={() => setSelected(d)}
                          className="flex w-full animate-rise-in items-center gap-3 rounded-xl2 bg-white p-4 text-left shadow-card transition-enter active:scale-[0.99]"
                          style={{ animationDelay: `${i * 30}ms` }}>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bronze/12 text-bronze-dark">
                            <Book size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink">{d.title}</p>
                            <p className="truncate text-xs text-ink/40">{(d.body || '').replace(/\n+/g, ' ').slice(0, 70)}…</p>
                          </div>
                          <Chevron size={18} className="text-ink/25" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
