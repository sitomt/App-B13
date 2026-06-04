import { useState } from 'react'
import Sheet from './Sheet'
import { listIncidenciaTypes, createIncidenciaType, updateIncidenciaType, deleteIncidenciaType } from '../lib/api'
import { useData } from '../lib/useData'
import { useToast } from './Toast'
import { Plus, Trash, Check } from './icons'

// Gestor de etiquetas/tipos de incidencia interna (añadir, renombrar, quitar).
export default function IncidenciaTypesEditor({ open, onClose }) {
  const types = useData(listIncidenciaTypes, [])
  const toast = useToast()
  const [nuevo, setNuevo] = useState('')
  const [busy, setBusy] = useState(false)
  const [edits, setEdits] = useState({}) // id -> label en edición

  async function add() {
    if (!nuevo.trim()) return
    setBusy(true)
    try {
      const max = Math.max(0, ...(types.data || []).map((t) => t.sort_order))
      await createIncidenciaType(nuevo.trim(), max + 1)
      setNuevo(''); await types.reload(true); toast('Etiqueta añadida ✓')
    } catch { toast('No se pudo añadir', 'error') } finally { setBusy(false) }
  }

  async function rename(t) {
    const label = (edits[t.id] ?? t.label).trim()
    if (!label || label === t.label) { setEdits((e) => ({ ...e, [t.id]: undefined })); return }
    try { await updateIncidenciaType(t.id, { label }); await types.reload(true); toast('Etiqueta actualizada') }
    catch { toast('No se pudo guardar', 'error') }
    setEdits((e) => ({ ...e, [t.id]: undefined }))
  }

  async function remove(t) {
    try { await deleteIncidenciaType(t.id); await types.reload(true); toast('Etiqueta quitada') }
    catch { toast('No se pudo quitar', 'error') }
  }

  const input = 'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-bronze'

  return (
    <Sheet open={open} onClose={onClose} title="Etiquetas de incidencia">
      <p className="mb-4 text-sm text-ink/55">Personaliza los tipos de incidencia interna que verán los coaches al reportar.</p>

      <div className="mb-5 space-y-2">
        {(types.data || []).map((t) => {
          const editing = edits[t.id] !== undefined
          return (
            <div key={t.id} className="flex items-center gap-2">
              <input
                value={editing ? edits[t.id] : t.label}
                onChange={(e) => setEdits((s) => ({ ...s, [t.id]: e.target.value }))}
                onFocus={() => setEdits((s) => ({ ...s, [t.id]: t.label }))}
                className={`${input} flex-1`}
              />
              {editing ? (
                <button onClick={() => rename(t)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage text-white active:scale-90">
                  <Check size={20} />
                </button>
              ) : (
                <button onClick={() => remove(t)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink/5 text-terracotta active:scale-90">
                  <Trash size={18} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink/40">Nueva etiqueta</label>
      <div className="flex items-center gap-2">
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Ej: Objetos perdidos" className={`${input} flex-1`} />
        <button onClick={add} disabled={busy} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-white active:scale-90 disabled:opacity-50">
          <Plus size={22} />
        </button>
      </div>
    </Sheet>
  )
}
