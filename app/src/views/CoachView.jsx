import { useState } from 'react'
import { Header, Screen } from '../components/AppShell'
import BottomNav from '../components/BottomNav'
import SpeedDial from '../components/SpeedDial'
import ReportIncident from '../components/ReportIncident'
import CleaningRequest from '../components/CleaningRequest'
import CoachToday from './coach/CoachToday'
import CoachGym from './coach/CoachGym'
import ScheduleScreen from './ScheduleScreen'
import { useSession } from '../state/session'
import { Activity, Dumbbell, Calendar, Alert, Wrench, Spray } from '../components/icons'

const TABS = [
  { key: 'hoy', label: 'Hoy', icon: Activity },
  { key: 'gym', label: 'El gym', icon: Dumbbell },
  { key: 'horario', label: 'Horarios', icon: Calendar },
]
const SUBTITLE = { hoy: 'Tu día', gym: 'El gym', horario: 'Horarios' }

export default function CoachView() {
  const { employee } = useSession()
  const [tab, setTab] = useState('hoy')
  const [reportOpen, setReportOpen] = useState(false)     // mantenimiento (instalaciones)
  const [incidentOpen, setIncidentOpen] = useState(false) // incidencia interna
  const [cleanOpen, setCleanOpen] = useState(false)

  return (
    <Screen>
      <Header subtitle={SUBTITLE[tab]} />

      <div className="mx-auto max-w-md px-4 pt-4">
        {tab === 'hoy' && <CoachToday />}
        {tab === 'gym' && <CoachGym />}
        {tab === 'horario' && <ScheduleScreen editable={false} />}
      </div>

      <SpeedDial
        actions={[
          { icon: Alert, label: 'Reportar incidencia', tone: 'ink', onClick: () => setIncidentOpen(true) },
          { icon: Wrench, label: 'Algo roto · Mantenimiento', tone: 'terracotta', onClick: () => setReportOpen(true) },
          { icon: Spray, label: 'Algo sucio · Limpieza', tone: 'bronze', onClick: () => setCleanOpen(true) },
        ]}
      />
      <ReportIncident target="incidencia" open={incidentOpen} onClose={() => setIncidentOpen(false)} employee={employee} />
      <ReportIncident target="mantenimiento" open={reportOpen} onClose={() => setReportOpen(false)} employee={employee} />
      <CleaningRequest open={cleanOpen} onClose={() => setCleanOpen(false)} employee={employee} />

      <BottomNav tabs={TABS} active={tab} onChange={setTab} />
    </Screen>
  )
}
