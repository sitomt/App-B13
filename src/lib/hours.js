// Cálculo de horas trabajadas a partir del registro de fichajes (time_entries).
// Recorre los eventos del día en orden y acumula SOLO el tiempo en estado "trabajando"
// (entre clock_in y clock_out), descontando pausas y comidas. Soporta turnos partidos
// (varias entradas/salidas el mismo día) sin contar los huecos intermedios.
//
// Turno abierto al final del día (entrada sin salida):
//   - si el día es HOY: es un turno en curso real → cuenta en vivo hasta ahora.
//   - si es un día PASADO: la salida no se fichó (dato incompleto) → NO se inventan horas
//     (se contabiliza 0 de ese tramo). Usa `incompleteDaysByEmployee` para detectarlos y avisar.

import { todayMadrid } from './date'

// Minutos trabajados en un día dado su lista de fichajes (ordenada o no).
export function workedMinutesForDay(entries, nowMs = Date.now()) {
  if (!entries || entries.length === 0) return 0
  const sorted = [...entries].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
  const t = (e) => new Date(e.occurred_at).getTime()
  const workDate = sorted.find((e) => e.work_date)?.work_date
  const isToday = workDate === todayMadrid()

  let workedMs = 0
  let working = false // entre clock_in y clock_out
  let paused = false  // dentro de una pausa/comida
  let lastTs = null   // inicio del tramo "trabajando" en curso

  // Cierra el tramo trabajado actual hasta `toTs` (si procede).
  const flush = (toTs) => {
    if (working && !paused && lastTs != null && toTs > lastTs) workedMs += toTs - lastTs
  }

  for (const e of sorted) {
    const ts = t(e)
    switch (e.kind) {
      case 'clock_in':
        flush(ts) // por si hubiera una entrada repetida sin salida previa
        working = true; paused = false; lastTs = ts
        break
      case 'clock_out':
        flush(ts)
        working = false; paused = false; lastTs = ts
        break
      case 'break_start':
      case 'meal_start':
        flush(ts)
        paused = true; lastTs = ts
        break
      case 'break_end':
      case 'meal_end':
        paused = false; lastTs = ts
        break
      default:
        break
    }
  }

  // Turno aún abierto: solo cuenta en vivo si es el día de hoy.
  if (working && !paused && isToday) flush(nowMs)

  return Math.max(0, Math.round(workedMs / 60000))
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

// ¿El día terminó con un turno abierto (una entrada sin su salida)?
export function dayEndsOpen(entries) {
  if (!entries || entries.length === 0) return false
  const sorted = [...entries].sort((a, b) => new Date(a.occurred_at) - new Date(b.occurred_at))
  let working = false
  for (const e of sorted) {
    if (e.kind === 'clock_in') working = true
    else if (e.kind === 'clock_out') working = false
  }
  return working
}

// Map empId -> nº de días PASADOS con turno sin cerrar (errores de fichaje a corregir).
// Excluye el día de hoy, donde un turno abierto es normal (en curso).
export function incompleteDaysByEmployee(entries) {
  const today = todayMadrid()
  const byEmpDay = new Map()
  for (const e of entries || []) {
    if (!byEmpDay.has(e.employee_id)) byEmpDay.set(e.employee_id, new Map())
    const days = byEmpDay.get(e.employee_id)
    if (!days.has(e.work_date)) days.set(e.work_date, [])
    days.get(e.work_date).push(e)
  }
  const res = new Map()
  for (const [empId, days] of byEmpDay) {
    let n = 0
    for (const [wd, de] of days) {
      if (wd !== today && dayEndsOpen(de)) n++
    }
    if (n > 0) res.set(empId, n)
  }
  return res
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
