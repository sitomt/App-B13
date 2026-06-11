import { useState } from 'react'
import { Header, Screen } from '../../components/AppShell'
import BottomNav from '../../components/BottomNav'
import SpeedDial from '../../components/SpeedDial'
import AnnouncementSheet from '../../components/AnnouncementSheet'
import CleaningRequest from '../../components/CleaningRequest'
import ReportIncident from '../../components/ReportIncident'
import AdminDashboard from './AdminDashboard'
import AdminIncidents from './AdminIncidents'
import AdminAnnouncements from './AdminAnnouncements'
import AdminTemplates from './AdminTemplates'
import AdminStats from './AdminStats'
import AdminTeam from './AdminTeam'
import AdminFeedback from './AdminFeedback'
import ScheduleScreen from '../ScheduleScreen'
import { useSession } from '../../state/session'
import { Activity, Megaphone, Settings, Wrench, Calendar, BarChart, User, Chat, Spray, Alert } from '../../components/icons'

const TABS = [
  { key: 'dash', label: 'Resumen', icon: Activity },
  { key: 'horario', label: 'Horarios', icon: Calendar },
  { key: 'inc', label: 'Incidencias', icon: Wrench },
  { key: 'feedback', label: 'Feedback', icon: Chat },
  { key: 'stats', label: 'Stats', icon: BarChart },
  { key: 'ann', label: 'Avisos', icon: Megaphone },
  { key: 'equipo', label: 'Equipo', icon: User },
  { key: 'tpl', label: 'Plantillas', icon: Settings },
]

export default function AdminView() {
  const { employee } = useSession()
  const [tab, setTab] = useState('dash')
  const [annOpen, setAnnOpen] = useState(false)
  const [cleanOpen, setCleanOpen] = useState(false)
  const [maintOpen, setMaintOpen] = useState(false)
  const [incidentOpen, setIncidentOpen] = useState(false)

  return (
    <Screen>
      <Header subtitle="Panel de control" />
      <div className="mx-auto max-w-md px-4 pt-4">
        {tab === 'dash' && <AdminDashboard />}
        {tab === 'horario' && <ScheduleScreen editable />}
        {tab === 'inc' && <AdminIncidents />}
        {tab === 'feedback' && <AdminFeedback />}
        {tab === 'stats' && <AdminStats />}
        {tab === 'ann' && <AdminAnnouncements />}
        {tab === 'equipo' && <AdminTeam />}
        {tab === 'tpl' && <AdminTemplates />}
      </div>

      {/* Acciones rápidas del responsable: comunicar y delegar sobre la marcha. */}
      <SpeedDial
        actions={[
          { icon: Megaphone, label: 'Aviso al equipo', tone: 'ink', onClick: () => setAnnOpen(true) },
          { icon: Spray, label: 'Tarea urgente · Limpieza', tone: 'bronze', onClick: () => setCleanOpen(true) },
          { icon: Wrench, label: 'Algo roto · Mantenimiento', tone: 'terracotta', onClick: () => setMaintOpen(true) },
          { icon: Alert, label: 'Incidencia interna', tone: 'ink', onClick: () => setIncidentOpen(true) },
        ]}
      />
      <AnnouncementSheet open={annOpen} onClose={() => setAnnOpen(false)} employee={employee} />
      <CleaningRequest open={cleanOpen} onClose={() => setCleanOpen(false)} employee={employee} />
      <ReportIncident target="mantenimiento" open={maintOpen} onClose={() => setMaintOpen(false)} employee={employee} />
      <ReportIncident target="incidencia" open={incidentOpen} onClose={() => setIncidentOpen(false)} employee={employee} />

      <BottomNav tabs={TABS} active={tab} onChange={setTab} />
    </Screen>
  )
}
