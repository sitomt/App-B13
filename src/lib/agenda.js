import { appliesToday } from './date'

// Construye el modelo de agenda del día a partir de las plantillas activas
// del rol y de los completados de hoy. Resuelve tareas únicas vs recurrentes.
export function buildAgenda(templates, completions) {
  const byTpl = new Map()
  for (const c of completions || []) {
    if (!c.template_id) continue
    if (!byTpl.has(c.template_id)) byTpl.set(c.template_id, [])
    byTpl.get(c.template_id).push(c)
  }

  const items = (templates || [])
    .filter((t) => appliesToday(t.weekdays))
    .map((t) => {
      const comps = byTpl.get(t.id) || []
      const last = comps[comps.length - 1] || null
      const recurring = t.recurrence === 'recurring'
      return {
        ...t,
        recurring,
        completions: comps,
        count: comps.length,
        done: recurring ? false : comps.length > 0,
        lastBy: last?.employee_name || null,
        lastById: last?.employee_id || null,
        lastAt: last?.completed_at || null,
        completionId: !recurring ? last?.id || null : null,
      }
    })

  const sections = {
    apertura: items.filter((i) => i.section === 'apertura'),
    agenda: items.filter((i) => i.section === 'agenda'),
    cierre: items.filter((i) => i.section === 'cierre'),
  }

  // Estadísticas por sección (solo tareas "únicas", las recurrentes no cuentan).
  const sectionStat = (key) => {
    const once = sections[key].filter((i) => !i.recurring)
    return { done: once.filter((i) => i.done).length, total: once.length }
  }
  const stats = {
    apertura: sectionStat('apertura'),
    agenda: sectionStat('agenda'),
    cierre: sectionStat('cierre'),
  }

  // Progreso global (todas las únicas) — útil para histórico.
  const onceItems = items.filter((i) => !i.recurring)
  const doneOnce = onceItems.filter((i) => i.done).length
  const progress = onceItems.length ? doneOnce / onceItems.length : 0

  // Progreso del día activo: apertura + agenda (el cierre es de fin de jornada,
  // no debe lastrar el % durante el día).
  const dayDone = stats.apertura.done + stats.agenda.done
  const dayTotal = stats.apertura.total + stats.agenda.total
  const dayProgress = dayTotal ? dayDone / dayTotal : 0

  return { sections, items, stats, progress, doneOnce, totalOnce: onceItems.length, dayProgress, dayDone, dayTotal }
}
