// Utilidades de fecha/hora ancladas a Europe/Madrid.
// La app razona siempre en la zona horaria del gimnasio.

const TZ = 'Europe/Madrid'

// Fecha de hoy en Madrid como 'YYYY-MM-DD' (coincide con work_date en BD).
export function todayMadrid() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  return parts // en-CA da YYYY-MM-DD
}

// Día de la semana en Madrid: 0=domingo ... 6=sábado
export function weekdayMadrid() {
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
  }).format(new Date())
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[wd]
}

const WEEKDAYS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// "lunes 1 de junio"
export function longDateMadrid() {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = (t) => f.find((p) => p.type === t).value
  const y = +get('year'), m = +get('month'), d = +get('day')
  const wd = weekdayMadrid()
  return `${WEEKDAYS_ES[wd]} ${d} de ${MONTHS_ES[m - 1]}`
}

// Hora local 'HH:MM' a partir de un timestamp ISO.
export function timeHM(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso))
}

// "hace 5 min" / "hace 2 h"
export function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  return `hace ${d} d`
}

// "1 jun" / "1 jun 2026" si es de otro año
export function shortDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const thisYear = new Date().getFullYear()
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: TZ, day: 'numeric', month: 'short',
    ...(d.getFullYear() !== thisYear ? { year: 'numeric' } : {}),
  }).format(d)
}

// "1 jun, 14:30"
export function dateTime(iso) {
  if (!iso) return ''
  return `${shortDate(iso)}, ${timeHM(iso)}`
}

// Días enteros entre dos instantes (por defecto hasta ahora).
export function daysBetween(fromIso, toIso = null) {
  if (!fromIso) return 0
  const a = new Date(fromIso).getTime()
  const b = toIso ? new Date(toIso).getTime() : Date.now()
  return Math.floor((b - a) / 86400000)
}

export function greetingMadrid() {
  const h = +new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour: '2-digit', hour12: false,
  }).format(new Date())
  if (h < 6) return 'Buenas noches'
  if (h < 14) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

// ---- Helpers de calendario (mes / semana) ----
const MONTHS_CAP = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DOW_SHORT = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

const pad = (n) => String(n).padStart(2, '0')
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

// Date "neutral" (mediodía local) a partir de 'YYYY-MM-DD' para evitar saltos de TZ.
export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

// Día de la semana (0=D..6=S) de un 'YYYY-MM-DD'
export function weekdayOf(str) {
  return parseDate(str).getDay()
}

export function dowLabel(str) {
  return DOW_SHORT[weekdayOf(str)]
}

// Límites del mes actual (+offset meses). Devuelve días del mes y etiqueta.
export function monthBounds(offset = 0) {
  const [y, m] = todayMadrid().split('-').map(Number)
  const base = new Date(y, m - 1 + offset, 1)
  const year = base.getFullYear()
  const month = base.getMonth() // 0-based
  const last = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let d = 1; d <= last; d++) days.push(toStr(new Date(year, month, d)))
  return { startStr: days[0], endStr: days[days.length - 1], year, month: month + 1, label: `${MONTHS_CAP[month]} ${year}`, days }
}

// Lunes a domingo de la semana que contiene hoy (+offset semanas).
export function weekBounds(offset = 0) {
  const [y, m, d] = todayMadrid().split('-').map(Number)
  const t = new Date(y, m - 1, d)
  const dow = (t.getDay() + 6) % 7 // 0=lunes
  const monday = new Date(y, m - 1, d - dow + offset * 7)
  const days = []
  for (let i = 0; i < 7; i++) days.push(toStr(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)))
  return { startStr: days[0], endStr: days[6], days, label: `Semana del ${parseDate(days[0]).getDate()} al ${parseDate(days[6]).getDate()} ${MONTHS_CAP[parseDate(days[6]).getMonth()].toLowerCase()}` }
}

export function isTodayStr(str) {
  return str === todayMadrid()
}

// Un día concreto (+offset = días hacia atrás). Para navegación en estadísticas.
export function dayBounds(offset = 0) {
  const [y, m, d] = todayMadrid().split('-').map(Number)
  const base = new Date(y, m - 1, d - offset)
  const str = toStr(base)
  let label
  if (offset === 0) label = 'Hoy'
  else if (offset === 1) label = 'Ayer'
  else label = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(base)
  return { startStr: str, endStr: str, days: [str], label }
}

// ¿La plantilla aplica hoy? weekdays vacío = todos los días.
export function appliesToday(weekdays) {
  if (!weekdays || weekdays.length === 0) return true
  return weekdays.includes(weekdayMadrid())
}
