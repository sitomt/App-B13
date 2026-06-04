import { supabase } from './supabase'
import { todayMadrid } from './date'

// =====================================================================
// Capa de acceso a datos. Cada acción se registra con quién/qué/cuándo
// para que sea analizable después.
// =====================================================================

// ---------- EMPLEADOS ----------
export async function listEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('active', true)
    .order('role')
    .order('name')
  if (error) throw error
  return data
}

// ---------- FICHAJES ----------
const KIND_LABEL = {
  clock_in: 'Entrada',
  clock_out: 'Salida',
  break_start: 'Inicio pausa',
  break_end: 'Fin pausa',
  meal_start: 'Inicio comida',
  meal_end: 'Fin comida',
}
export { KIND_LABEL }

// Estado actual derivado del último fichaje de hoy.
// Devuelve: 'out' | 'working' | 'break' | 'meal'
export function deriveStatus(entries) {
  if (!entries || entries.length === 0) return 'out'
  const last = entries[entries.length - 1]
  switch (last.kind) {
    case 'clock_in':
    case 'break_end':
    case 'meal_end':
      return 'working'
    case 'break_start':
      return 'break'
    case 'meal_start':
      return 'meal'
    case 'clock_out':
      return 'out'
    default:
      return 'out'
  }
}

export async function todayEntries(employeeId) {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('work_date', todayMadrid())
    .order('occurred_at', { ascending: true })
  if (error) throw error
  return data
}

export async function allTodayEntries() {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*, employee:employees(id,name,role,color)')
    .eq('work_date', todayMadrid())
    .order('occurred_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addTimeEntry(employeeId, kind, notes = null) {
  const { error } = await supabase
    .from('time_entries')
    .insert({ employee_id: employeeId, kind, notes })
  if (error) throw error
}

// ---------- PLANTILLAS ----------
export async function listTemplates(role) {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .eq('role', role)
    .eq('active', true)
    .order('section')
    .order('scheduled_time', { nullsFirst: true })
    .order('sort_order')
  if (error) throw error
  return data
}

export async function listAllTemplates() {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .order('role')
    .order('section')
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createTemplate(t) {
  const { error } = await supabase.from('task_templates').insert(t)
  if (error) throw error
}

export async function updateTemplate(id, patch) {
  const { error } = await supabase.from('task_templates').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteTemplate(id) {
  const { error } = await supabase.from('task_templates').delete().eq('id', id)
  if (error) throw error
}

// ---------- COMPLETADOS ----------
export async function todayCompletions(role) {
  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .eq('role', role)
    .eq('work_date', todayMadrid())
    .order('completed_at', { ascending: true })
  if (error) throw error
  return data
}

export async function completeTask(template, employee, notes = null) {
  const { data, error } = await supabase.from('task_completions').insert({
    template_id: template.id,
    title: template.title,
    section: template.section,
    role: template.role,
    employee_id: employee.id,
    employee_name: employee.name,
    notes,
  }).select().single()
  if (error) throw error
  return data // se devuelve para poder ofrecer "Deshacer" sin esperar al refetch
}

export async function undoCompletion(completionId) {
  const { error } = await supabase.from('task_completions').delete().eq('id', completionId)
  if (error) throw error
}

// ---------- TAREAS PUNTUALES / AVISOS URGENTES ----------
export async function listAdHoc(targetRole) {
  const { data, error } = await supabase
    .from('ad_hoc_tasks')
    .select('*')
    .eq('target_role', targetRole)
    .eq('work_date', todayMadrid())
    .order('status')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAdHoc(t) {
  const { error } = await supabase.from('ad_hoc_tasks').insert(t)
  if (error) throw error
}

export async function completeAdHoc(id, employee) {
  const { error } = await supabase
    .from('ad_hoc_tasks')
    .update({
      status: 'done',
      done_by: employee.id,
      done_by_name: employee.name,
      done_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

// ---------- FOTOS (Storage) ----------
export const PHOTO_BUCKET = 'Fotos Baktun'

// Sube una foto al bucket y devuelve su URL pública.
export async function uploadPhoto(file, folder = 'incidents') {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ---------- INCIDENCIAS INTERNAS (las resuelve el equipo) ----------
export async function listIncidencias() {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('status')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createIncidencia(i) {
  const { error } = await supabase.from('incidents').insert(i)
  if (error) throw error
}

export async function updateIncidencia(id, patch) {
  const { error } = await supabase.from('incidents').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteIncidencia(id) {
  const { error } = await supabase.from('incidents').delete().eq('id', id)
  if (error) throw error
}

// ---------- TIPOS DE INCIDENCIA (etiquetas editables por el admin) ----------
export async function listIncidenciaTypes() {
  const { data, error } = await supabase
    .from('incidencia_types')
    .select('*')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return data
}

export async function createIncidenciaType(label, sortOrder = 99) {
  const { error } = await supabase.from('incidencia_types').insert({ label, sort_order: sortOrder })
  if (error) throw error
}

export async function updateIncidenciaType(id, patch) {
  const { error } = await supabase.from('incidencia_types').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteIncidenciaType(id) {
  // Borrado lógico para no perder histórico de incidencias ya etiquetadas
  const { error } = await supabase.from('incidencia_types').update({ active: false }).eq('id', id)
  if (error) throw error
}

// ---------- MANTENIMIENTO (partes del técnico externo, instalaciones) ----------
export async function listMaintenance() {
  const { data, error } = await supabase
    .from('maintenance_tasks')
    .select('*')
    .order('status')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createMaintenance(t) {
  const { error } = await supabase.from('maintenance_tasks').insert(t)
  if (error) throw error
}

export async function updateMaintenance(id, patch) {
  const { error } = await supabase.from('maintenance_tasks').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteMaintenance(id) {
  const { error } = await supabase.from('maintenance_tasks').delete().eq('id', id)
  if (error) throw error
}

// ---------- HORARIOS (shifts) ----------
export async function listShifts(fromDate, toDate) {
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .gte('work_date', fromDate)
    .lte('work_date', toDate)
    .order('work_date')
    .order('start_time')
  if (error) throw error
  return data
}

export async function upsertShift(shift) {
  const { error } = await supabase
    .from('shifts')
    .upsert(shift, { onConflict: 'employee_id,work_date' })
  if (error) throw error
}

export async function deleteShift(employeeId, workDate) {
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
  if (error) throw error
}

// ---------- FICHAJES / COMPLETADOS POR RANGO (horas y estadísticas) ----------
export async function rangeTimeEntries(fromDate, toDate) {
  const { data, error } = await supabase
    .from('time_entries')
    .select('id, employee_id, kind, occurred_at, work_date')
    .gte('work_date', fromDate)
    .lte('work_date', toDate)
    .order('occurred_at')
  if (error) throw error
  return data
}

export async function rangeCompletions(fromDate, toDate) {
  const { data, error } = await supabase
    .from('task_completions')
    .select('*')
    .gte('work_date', fromDate)
    .lte('work_date', toDate)
  if (error) throw error
  return data
}

// ---------- COMUNICACIÓN INTERNA ----------
export async function activeAnnouncements(role) {
  const today = todayMadrid()
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('active', true)
    .lte('starts_on', today)
    .gte('ends_on', today)
    .contains('target_roles', [role])
    .order('priority', { ascending: false })
    .order('ends_on', { ascending: true })
  if (error) throw error
  return data
}

export async function listAllAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('active', { ascending: false })
    .order('ends_on', { ascending: false })
  if (error) throw error
  return data
}

export async function createAnnouncement(a) {
  const { error } = await supabase.from('announcements').insert(a)
  if (error) throw error
}

export async function updateAnnouncement(id, patch) {
  const { error } = await supabase.from('announcements').update(patch).eq('id', id)
  if (error) throw error
}
