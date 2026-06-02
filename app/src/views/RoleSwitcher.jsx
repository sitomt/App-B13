import { listEmployees } from '../lib/api'
import { useData } from '../lib/useData'
import { useSession } from '../state/session'
import { Wordmark } from '../components/Logo'
import { FullLoader } from '../components/ui'
import { Key, Spray, Wrench, Dumbbell, Settings, Chevron } from '../components/icons'

const ROLE_META = {
  admin: { label: 'Administración', icon: Settings, desc: 'Control total del gimnasio' },
  coach: { label: 'Coaches', icon: Dumbbell, desc: 'Agenda, fichaje y sala' },
  cleaning: { label: 'Limpieza', icon: Spray, desc: 'Ruta y avisos' },
  maintenance: { label: 'Mantenimiento', icon: Wrench, desc: 'Incidencias y reparaciones' },
}
const ORDER = ['admin', 'coach', 'cleaning', 'maintenance']

function Avatar({ emp }) {
  const initials = emp.name.split(' ').map((p) => p[0]).slice(0, 2).join('')
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-extrabold text-white"
      style={{ background: emp.color }}
    >
      {initials}
    </span>
  )
}

export default function RoleSwitcher() {
  const { data: employees, loading } = useData(listEmployees, [])
  const { login } = useSession()

  if (loading) return <FullLoader />

  const byRole = (role) => (employees || []).filter((e) => e.role === role)

  return (
    <div className="min-h-dvh bg-ink text-white">
      <div className="mx-auto max-w-md px-6 pb-16 pt-safe">
        <div className="flex flex-col items-center pt-16 text-center">
          <Wordmark variant="white" className="h-7 w-auto" />
          <p className="mt-4 text-sm text-white/45">Operativa interna · selecciona tu perfil</p>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[11px] font-semibold text-white/50">
            <Key size={12} /> Acceso simulado · el login con PIN llegará después
          </span>
        </div>

        <div className="mt-10 space-y-7">
          {ORDER.map((role) => {
            const list = byRole(role)
            if (!list.length) return null
            const meta = ROLE_META[role]
            const Icon = meta.icon
            return (
              <div key={role}>
                <div className="mb-2 flex items-center gap-2 px-1 text-white/55">
                  <Icon size={16} />
                  <h2 className="font-display text-lg font-bold">{meta.label}</h2>
                </div>
                <div className="space-y-2">
                  {list.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => login(emp)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.06] p-3 text-left transition active:scale-[0.98] hover:bg-white/10"
                    >
                      <Avatar emp={emp} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{emp.name}</p>
                        <p className="text-xs text-white/45">{meta.desc}</p>
                      </div>
                      <Chevron size={18} className="text-white/30" />
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
