// Cálculo de horas trabajadas a partir del registro de fichajes (time_entries).
// Empareja entrada→salida y descuenta pausas y comidas. Soporta turnos en curso.

// Minutos trabajados en un día dado su lista de fichajes (ordenada o no).
export function workedMinutesForDay(entries, nowMs = Date.now()) {
  if (!entries || entries.length === 0) return 0
  const sorted = [...entries].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
  const t = (e) => new Date(e.occurred_at).getTime()

  const clockIn = sorted.find((e) => e.kind === 'clock_in')
  if (!clockIn) return 0
  const clockOut = [...sorted].reverse().find((e) => e.kind === 'clock_out')
  const start = t(clockIn)
  const end = clockOut ? t(clockOut) : nowMs
  if (end <= start) return 0

  // Descontar pausas/comidas (incluida una abierta hasta 'end').
  let paused = 0
  let openPause = null
  for (const e of sorted) {
    if (e.kind === 'break_start' || e.kind === 'meal_start') openPause = t(e)
    if ((e.kind === 'break_end' || e.kind === 'meal_end') && openPause != null) {
      paused += Math.max(0, t(e) - openPause)
      openPause = null
    }
  }
  if (openPause != null) paused += Math.max(0, end - openPause)

  return Math.max(0, Math.round((end - start - paused) / 60000))
}

// Agrega minutos trabajados por empleado en un rango (lista de entries con employee_id y work_date).
export function workedMinutesByEmployee(entries, nowMs = Date.now()) {
  const byEmpDay = new Map() // empId -> date -> entries[]
  for (const e of entries || []) {
    if (!byEmpDay.has(e.employee_id)) byEmpDay.set(e.employee_id, new Map())
    const days = byEmpDay.get(e.employee_id)
    if (!days.has(e.work_date)) days.set(e.work_date, [])
    days.get(e.work_date).push(e)
  }
  const totals = new Map()
  for (const [empId, days] of byEmpDay) {
    let sum = 0
    for (const [, dayEntries] of days) sum += workedMinutesForDay(dayEntries, nowMs)
    totals.set(empId, sum)
  }
  return totals
}

// "8h 30m" / "0h"
export function fmtMinutes(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// Decimal "8,5 h" para totales/medias
export function fmtHoursDecimal(min) {
  return `${(min / 60).toFixed(1).replace('.', ',')} h`
}
