import { Wordmark } from './Logo'
import { Chevron } from './icons'
import ScheduleScreen from '../views/ScheduleScreen'

// Pantalla completa de horarios (solo lectura) para coach / limpieza / mantenimiento.
export default function ScheduleOverlay({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-sand">
      <header className="sticky top-0 z-10 bg-ink px-5 pb-4 pt-safe text-white">
        <div className="flex items-center justify-between pt-4">
          <button onClick={onClose} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold active:scale-95">
            <Chevron size={16} className="rotate-180" /> Volver
          </button>
          <Wordmark variant="white" className="h-4 w-auto" />
        </div>
        <h1 className="mt-3 font-display text-2xl font-extrabold">Horarios del equipo</h1>
      </header>
      <div className="mx-auto max-w-md px-4 pt-4">
        <ScheduleScreen editable={false} />
      </div>
    </div>
  )
}
