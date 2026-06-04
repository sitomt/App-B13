import { useState } from 'react'
import { listIncidencias, updateIncidencia, deleteIncidencia, listMaintenance, updateMaintenance, deleteMaintenance } from '../../lib/api'
import { useData } from '../../lib/useData'
import { useSession } from '../../state/session'
import { useToast } from '../../components/Toast'
import { Card, SectionTitle, Pill, Spinner, EmptyState } from '../../components/ui'
import IncidenciaTypesEditor from '../../components/IncidenciaTypesEditor'
import ReportIncident from '../../components/ReportIncident'
import { Alert, Wrench, Check, Clock, User, Settings, Trash, Plus } from '../../components/icons'
import { shortDate, dateTime, daysBetween, relativeTime } from '../../lib/date'

const STATUS = {
  pending: { label: 'Pendiente', pill: 'terracotta' },
  in_progress: { label: 'En curso', pill: 'ochre' },
  done: { label: 'Resuelta', pill: 'sage' },
}
const STATUS_FILTERS = [
  { key: 'open', label: 'Abiertas' },
  { key: 'done', label: 'Resueltas' },
  { key: 'all', label: 'Todas' },
]
const SOURCES = [
  { key: 'incidencia', label: 'Internas', icon: Alert },
  { key: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
]

function Step({ color, label, who, when, last }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`mt-1 h-3 w-3 rounded-full ${color}`} />
        {!last && <span className="my-0.5 w-px flex-1 bg-ink/15" />}
      </div>
      <div className="pb-3">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink/45">{when}{who ? ` · ${who}` : ''}</p>
      </div>
    </div>
  )
}

function IncidentCard({ inc, onStart, onResolve, onDelete, isMaint }) {
  const [open, setOpen] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const done = inc.status === 'done'
  const days = daysBetween(inc.created_at, done ? inc.resolved_at : null)
  const aging = !done && days >= 2

  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full p-4 text-left">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Pill color={STATUS[inc.status].pill}>{STATUS[inc.status].label}</Pill>
          {inc.priority === 'urgent' && !done && <Pill color="terracotta">URGENTE</Pill>}
          {inc.category && <span className="text-xs font-semibold text-ink/40">{inc.category}</span>}
        </div>
        <div className="flex gap-3">
          {inc.photo_url && <img src={inc.photo_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />}
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold leading-tight text-ink">{inc.title}</p>
            {inc.zone && <p className="text-sm font-semibold text-bronze-dark">{inc.zone}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink/45">
              <span className="flex items-center gap-1"><User size={11} /> {inc.reported_by_name || '—'}</span>
              <span>· {shortDate(inc.created_at)}</span>
              {done ? (
                <span className="font-semibold text-sage">· resuelta en {days === 0 ? 'el día' : `${days} día${days > 1 ? 's' : ''}`}</span>
              ) : (
                <span className={`font-semibold ${aging ? 'text-terracotta' : 'text-ink/45'}`}>· abierta {days === 0 ? 'hoy' : `hace ${days} día${days > 1 ? 's' : ''}`}</span>
              )}
            </p>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-ink/[0.06] bg-sand-50 px-4 py-3">
          {inc.description && <p className="mb-3 text-sm text-ink/65">{inc.description}</p>}
          {inc.photo_url && (
            <a href={inc.photo_url} target="_blank" rel="noreferrer" className="mb-3 block">
              <img src={inc.photo_url} alt="incidencia" className="h-44 w-full rounded-xl object-cover" />
            </a>
          )}
          <div className="rounded-xl bg-white p-3">
            <Step color="bg-terracotta" label="Reportada" who={inc.reported_by_name} when={dateTime(inc.created_at)} />
            {inc.started_at && <Step color="bg-ochre" label="En curso" who={inc.started_by_name} when={dateTime(inc.started_at)} last={!done} />}
            {done && <Step color="bg-sage" label="Resuelta" who={inc.resolved_by_name} when={dateTime(inc.resolved_at)} last />}
            {!done && !inc.started_at && <Step color="bg-ink/20" label="Sin empezar" when={`pendiente · ${relativeTime(inc.created_at)}`} last />}
          </div>
          {done && inc.resolution_notes && (
            <div className="mt-2 rounded-xl bg-sage/8 p-2.5 text-sm text-sage">
              <span className="font-semibold">Resolución:</span> {inc.resolution_notes}
            </div>
          )}
          {!done && (
            <div className="mt-3 flex gap-2">
              {inc.status === 'pending' && isMaint && (
                <button onClick={() => onStart(inc)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ochre/15 py-2.5 text-sm font-bold text-[#8a6a1e] transition-enter active:scale-95">
                  <Clock size={16} /> Marcar en curso
                </button>
              )}
              <button onClick={() => onResolve(inc)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sage py-2.5 text-sm font-bold text-white transition-enter active:scale-95">
                <Check size={16} /> Marcar resuelta
              </button>
            </div>
          )}

          {/* Eliminar (admin): borrado en dos pasos para evitar accidentes */}
          {confirmDel ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-terracotta/8 p-2">
              <span className="flex-1 px-1 text-sm font-semibold text-terracotta">¿Eliminar definitivamente?</span>
              <button onClick={() => setConfirmDel(false)} className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-ink/60 transition-enter active:scale-95">
                Cancelar
              </button>
              <button onClick={() => onDelete(inc)} className="rounded-lg bg-terracotta px-3 py-2 text-sm font-extrabold text-white transition-enter active:scale-95">
                Sí, eliminar
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDel(true)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-terracotta transition-enter active:scale-95">
              <Trash size={16} /> Eliminar {isMaint ? 'parte' : 'incidencia'}
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

export default function AdminIncidents() {
  const { employee } = useSession()
  const toast = useToast()
  const incidencias = useData(listIncidencias, [], { interval: 20000 })
  const maintenance = useData(listMaintenance, [], { interval: 20000 })
  const [source, setSource] = useState('incidencia')
  const [sf, setSf] = useState('open')
  const [editTags, setEditTags] = useState(false)
  const [adding, setAdding] = useState(false)

  const isMaint = source === 'mantenimiento'
  const active = isMaint ? maintenance : incidencias
  const list = active.data || []
  const done = list.filter((i) => i.status === 'done')
  const open = list.filter((i) => i.status !== 'done')
  const shown = sf === 'open' ? open : sf === 'done' ? done : list

  async function onStart(i) {
    try {
      await updateMaintenance(i.id, { status: 'in_progress', started_at: i.started_at || new Date().toISOString(), started_by_name: i.started_by_name || employee.name })
      await maintenance.reload(true); toast('Marcado en curso')
    } catch { toast('No se pudo actualizar', 'error') }
  }
  async function onResolve(i) {
    try {
      const patch = { status: 'done', resolved_by_name: employee.name, resolved_at: new Date().toISOString() }
      if (isMaint) { await updateMaintenance(i.id, patch); await maintenance.reload(true) }
      else { await updateIncidencia(i.id, patch); await incidencias.reload(true) }
      toast('Marcada como resuelta ✓')
    } catch { toast('No se pudo actualizar', 'error') }
  }
  async function onDelete(i) {
    try {
      if (isMaint) { await deleteMaintenance(i.id); await maintenance.reload(true) }
      else { await deleteIncidencia(i.id); await incidencias.reload(true) }
      toast(isMaint ? 'Parte eliminado' : 'Incidencia eliminada')
    } catch { toast('No se pudo eliminar', 'error') }
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Toggle de fuente */}
      <div className="flex gap-2">
        {SOURCES.map((s) => {
          const Icon = s.icon
          const on = source === s.key
          const n = ((s.key === 'mantenimiento' ? maintenance.data : incidencias.data) || []).filter((i) => i.status !== 'done').length
          return (
            <button key={s.key} onClick={() => setSource(s.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition active:scale-95 ${on ? 'bg-ink text-white' : 'bg-ink/5 text-ink/55'}`}>
              <Icon size={18} /> {s.label}
              {n > 0 && <span className={`rounded-full px-1.5 text-xs ${on ? 'bg-white/20' : 'bg-terracotta/15 text-terracotta'}`}>{n}</span>}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { n: list.filter((i) => i.status === 'pending').length, label: 'Pendientes', color: 'text-terracotta' },
          { n: list.filter((i) => i.status === 'in_progress').length, label: 'En curso', color: 'text-ochre' },
          { n: done.length, label: 'Resueltas', color: 'text-sage' },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <p className={`font-display text-3xl font-extrabold ${s.color}`}>{s.n}</p>
            <p className="text-xs text-ink/45">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button key={f.key} onClick={() => setSf(f.key)}
            className={`flex-1 rounded-2xl py-2.5 text-sm font-bold transition active:scale-95 ${sf === f.key ? 'bg-bronze text-white' : 'bg-ink/5 text-ink/60'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <SectionTitle
        icon={isMaint ? Wrench : Alert}
        right={
          <div className="flex items-center gap-2">
            {!isMaint && (
              <button onClick={() => setEditTags(true)} className="flex items-center gap-1 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold text-ink/60 transition-enter active:scale-95">
                <Settings size={13} /> Etiquetas
              </button>
            )}
            <button onClick={() => setAdding(true)} className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white transition-enter active:scale-95">
              <Plus size={13} /> Añadir
            </button>
          </div>
        }
      >
        {isMaint ? 'Partes de mantenimiento' : 'Incidencias internas'}
      </SectionTitle>

      {active.loading ? (
        <div className="flex justify-center py-10"><Spinner className="h-7 w-7" /></div>
      ) : shown.length === 0 ? (
        <EmptyState icon={isMaint ? Wrench : Alert} title="Nada por aquí" subtitle="No hay registros en este filtro." />
      ) : (
        <div className="space-y-3">
          {shown.map((i) => <IncidentCard key={i.id} inc={i} onStart={onStart} onResolve={onResolve} onDelete={onDelete} isMaint={isMaint} />)}
        </div>
      )}

      <IncidenciaTypesEditor open={editTags} onClose={() => setEditTags(false)} />

      {/* Alta de incidencia/parte por el admin (reutiliza el formulario del coach) */}
      <ReportIncident
        open={adding}
        onClose={() => setAdding(false)}
        employee={employee}
        target={isMaint ? 'mantenimiento' : 'incidencia'}
        onCreated={() => (isMaint ? maintenance.reload(true) : incidencias.reload(true))}
      />
    </div>
  )
}
