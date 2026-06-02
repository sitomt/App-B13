import { useState } from 'react'
import { listAllTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../lib/api'
import { useData } from '../../lib/useData'
import { useToast } from '../../components/Toast'
import { Card, SectionTitle, Pill } from '../../components/ui'
import Sheet from '../../components/Sheet'
import { Plus, Trash, Settings, Sunrise, Moon, Activity, Refresh, Clock } from '../../components/icons'

const WEEKDAYS = [
  { v: 1, l: 'L' }, { v: 2, l: 'M' }, { v: 3, l: 'X' }, { v: 4, l: 'J' },
  { v: 5, l: 'V' }, { v: 6, l: 'S' }, { v: 0, l: 'D' },
]
const SECTIONS = [
  { key: 'apertura', label: 'Apertura', icon: Sunrise },
  { key: 'agenda', label: 'Agenda', icon: Activity },
  { key: 'cierre', label: 'Cierre', icon: Moon },
]
const ROLE_LABEL = { coach: 'Coaches', cleaning: 'Limpieza' }

function emptyDraft(role = 'coach', section = 'agenda') {
  return { role, section, title: '', weekdays: [], scheduled_time: '', recurrence: 'once', recurrence_label: '', category: '', sort_order: 50 }
}

function weekdaysLabel(wd) {
  if (!wd || wd.length === 0) return 'Todos los días'
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.filter((d) => wd.includes(d)).map((d) => WEEKDAYS.find((w) => w.v === d).l).join(' ')
}

export default function AdminTemplates() {
  const toast = useToast()
  const tpls = useData(listAllTemplates, [])
  const [draft, setDraft] = useState(null) // null=cerrado
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false) // confirmación de borrado en dos pasos

  function closeEditor() { setDraft(null); setEditingId(null); setConfirmDel(false) }
  function openNew(role, section) { setEditingId(null); setConfirmDel(false); setDraft(emptyDraft(role, section)) }
  function openEdit(t) {
    setEditingId(t.id)
    setConfirmDel(false)
    setDraft({
      role: t.role, section: t.section, title: t.title,
      weekdays: t.weekdays || [], scheduled_time: t.scheduled_time ? t.scheduled_time.slice(0, 5) : '',
      recurrence: t.recurrence, recurrence_label: t.recurrence_label || '',
      category: t.category || '', sort_order: t.sort_order,
    })
  }

  async function save() {
    if (!draft.title.trim()) { toast('Pon un título', 'error'); return }
    setBusy(true)
    const payload = {
      role: draft.role, section: draft.section, title: draft.title.trim(),
      weekdays: draft.weekdays, scheduled_time: draft.scheduled_time || null,
      recurrence: draft.recurrence, recurrence_label: draft.recurrence === 'recurring' ? (draft.recurrence_label || null) : null,
      category: draft.category.trim() || null, sort_order: draft.sort_order,
    }
    try {
      if (editingId) await updateTemplate(editingId, payload)
      else await createTemplate(payload)
      toast(editingId ? 'Plantilla actualizada' : 'Plantilla creada ✓')
      closeEditor()
      await tpls.reload(true)
    } catch { toast('No se pudo guardar', 'error') } finally { setBusy(false) }
  }

  async function remove() {
    if (!editingId) return
    setBusy(true)
    try {
      await deleteTemplate(editingId)
      toast('Plantilla eliminada')
      closeEditor()
      await tpls.reload(true)
    } catch { toast('No se pudo eliminar', 'error') } finally { setBusy(false) }
  }

  const list = tpls.data || []
  const input = 'w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-base outline-none focus:border-bronze'

  return (
    <div className="space-y-6 pb-24">
      {['coach', 'cleaning'].map((role) => (
        <div key={role}>
          <SectionTitle icon={Settings}>{ROLE_LABEL[role]}</SectionTitle>
          <div className="space-y-4">
            {SECTIONS.map((sec) => {
              const items = list.filter((t) => t.role === role && t.section === sec.key)
              // Limpieza no usa apertura/cierre
              if (role === 'cleaning' && sec.key !== 'agenda') return null
              const Icon = sec.icon
              return (
                <Card key={sec.key} className="overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-ink/[0.06] px-4 py-3">
                    <Icon size={18} className="text-ink/50" />
                    <p className="flex-1 font-display text-lg font-bold">{sec.label}</p>
                    <button onClick={() => openNew(role, sec.key)} className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white active:scale-95">
                      <Plus size={14} /> Añadir
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-ink/35">Sin tareas.</p>
                  ) : (
                    <div className="divide-y divide-ink/[0.06]">
                      {items.map((t) => (
                        <button key={t.id} onClick={() => openEdit(t)} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-ink/[0.03]">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-ink">{t.title}</p>
                            <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink/40">
                              <span>{weekdaysLabel(t.weekdays)}</span>
                              {t.scheduled_time && <span className="inline-flex items-center gap-0.5"><Clock size={11} />{t.scheduled_time.slice(0, 5)}</span>}
                              {t.recurrence === 'recurring' && <span className="inline-flex items-center gap-0.5 text-stone"><Refresh size={11} />{t.recurrence_label}</span>}
                            </p>
                          </div>
                          {t.category && <Pill color="ink">{t.category}</Pill>}
                          {!t.active && <Pill color="terracotta">inactiva</Pill>}
                        </button>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {/* Editor */}
      <Sheet open={!!draft} onClose={closeEditor} title={editingId ? 'Editar tarea' : 'Nueva tarea'}>
        {draft && (
          <div className="space-y-4">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Título de la tarea" className={input} autoFocus />

            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/40">Sección</p>
              <div className="flex gap-2">
                {SECTIONS.filter((s) => draft.role === 'coach' || s.key === 'agenda').map((s) => (
                  <button key={s.key} onClick={() => setDraft({ ...draft, section: s.key })}
                    className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold transition active:scale-95 ${draft.section === s.key ? 'bg-ink text-white' : 'bg-ink/5 text-ink/70'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/40">Días (ninguno = todos)</p>
              <div className="flex gap-1.5">
                {WEEKDAYS.map((w) => {
                  const on = draft.weekdays.includes(w.v)
                  return (
                    <button key={w.v} onClick={() => setDraft({ ...draft, weekdays: on ? draft.weekdays.filter((x) => x !== w.v) : [...draft.weekdays, w.v] })}
                      className={`h-10 w-10 rounded-full text-sm font-bold transition active:scale-90 ${on ? 'bg-bronze text-white' : 'bg-ink/5 text-ink/50'}`}>
                      {w.l}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/40">Hora</p>
                <input type="time" value={draft.scheduled_time} onChange={(e) => setDraft({ ...draft, scheduled_time: e.target.value })} className={input} />
              </div>
              <div className="flex-1">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/40">Categoría</p>
                <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="aseos, caja…" className={input} />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/40">Tipo</p>
              <div className="flex gap-2">
                <button onClick={() => setDraft({ ...draft, recurrence: 'once' })}
                  className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold transition active:scale-95 ${draft.recurrence === 'once' ? 'bg-ink text-white' : 'bg-ink/5 text-ink/70'}`}>
                  Una vez al día
                </button>
                <button onClick={() => setDraft({ ...draft, recurrence: 'recurring' })}
                  className={`flex-1 rounded-2xl py-2.5 text-sm font-semibold transition active:scale-95 ${draft.recurrence === 'recurring' ? 'bg-ink text-white' : 'bg-ink/5 text-ink/70'}`}>
                  Recurrente
                </button>
              </div>
            </div>

            {draft.recurrence === 'recurring' && (
              <input value={draft.recurrence_label} onChange={(e) => setDraft({ ...draft, recurrence_label: e.target.value })} placeholder="Ej: cada 30 min" className={input} />
            )}

            <button onClick={save} disabled={busy} className="w-full rounded-2xl bg-ink py-4 text-lg font-extrabold text-white transition-enter active:scale-[0.98] disabled:opacity-50">
              {editingId ? 'Guardar cambios' : 'Crear tarea'}
            </button>
            {editingId && (
              confirmDel ? (
                <div className="flex items-center gap-2 rounded-2xl bg-terracotta/8 p-2">
                  <span className="flex-1 px-2 text-sm font-semibold text-terracotta">¿Eliminar esta plantilla?</span>
                  <button onClick={() => setConfirmDel(false)} className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-ink/60 transition-enter active:scale-95">
                    Cancelar
                  </button>
                  <button onClick={remove} disabled={busy} className="rounded-xl bg-terracotta px-3 py-2 text-sm font-extrabold text-white transition-enter active:scale-95 disabled:opacity-50">
                    Sí, eliminar
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDel(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-terracotta transition-enter active:scale-95">
                  <Trash size={16} /> Eliminar plantilla
                </button>
              )
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}
