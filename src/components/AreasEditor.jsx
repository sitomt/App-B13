import { useState } from 'react'
import Sheet from './Sheet'
import { listAreas, createArea, updateArea, deleteArea } from '../lib/api'
import { useData } from '../lib/useData'
import { useToast } from './Toast'
import { Plus, Trash, Check } from './icons'

// Gestor de áreas / locales de la instalación (añadir, renombrar, quitar).
export default function AreasEditor({ open, onClose }) {
  const areas = useData(listAreas, [])
  const toast = useToast()
  const [nuevo, setNuevo] = useState('')
  const [busy, setBusy] = useState(false)
  const [edits, setEdits] = useState({}) // id -> nombre en edición

  async function add() {
    if (!nuevo.trim()) return
    setBusy(true)
    try {
      const max = Math.max(0, ...(areas.data || []).map((a) => a.sort_order))
      await createArea(nuevo.trim(), max + 1)
      setNuevo(''); await areas.reload(true); toast('Área añadida ✓')
    } catch { toast('No se pudo añadir', 'error') } finally { setBusy(false) }
  }

  async function rename(a) {
    const name = (edits[a.id] ?? a.name).trim()
    if (!name || name === a.name) { setEdits((e) => ({ ...e, [a.id]: undefined })); return }
    try { await updateArea(a.id, { name }); await areas.reload(true); toast('Área actualizada') }
    catch { toast('No se pudo guardar', 'error') }
    setEdits((e) => ({ ...e, [a.id]: undefined }))
  }

  async function remove(a) {
    try { await deleteArea(a.id); await areas.reload(true); toast('Área quitada') }
    catch { toast('No se pudo quitar', 'error') }
  }

  const input = 'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-bronze'

  return (
    <Sheet open={open} onClose={onClose} title="Áreas / locales">
      <p className="mb-4 text-sm text-ink/55">Los locales de la instalación que verá quien reporte una incidencia (musculación, pilates, artes marciales…).</p>

      <div className="mb-5 space-y-2">
        {(areas.data || []).map((a) => {
          const editing = edits[a.id] !== undefined
          return (
            <div key={a.id} className="flex items-center gap-2">
              <input
                value={editing ? edits[a.id] : a.name}
                onChange={(e) => setEdits((s) => ({ ...s, [a.id]: e.target.value }))}
                onFocus={() => setEdits((s) => ({ ...s, [a.id]: a.name }))}
                className={`${input} flex-1`}
              />
              {editing ? (
                <button onClick={() => rename(a)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage text-white active:scale-90">
                  <Check size={20} />
                </button>
              ) : (
                <button onClick={() => remove(a)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink/5 text-terracotta active:scale-90">
                  <Trash size={18} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40">Nueva área</label>
      <div className="flex items-center gap-2">
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Ej: Sala de spinning" className={`${input} flex-1`} />
        <button onClick={add} disabled={busy} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-white active:scale-90 disabled:opacity-50">
          <Plus size={22} />
        </button>
      </div>
    </Sheet>
  )
}
