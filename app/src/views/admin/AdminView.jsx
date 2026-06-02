import { useState } from 'react'
import { Header, Screen } from '../../components/AppShell'
import BottomNav from '../../components/BottomNav'
import AdminDashboard from './AdminDashboard'
import AdminIncidents from './AdminIncidents'
import AdminAnnouncements from './AdminAnnouncements'
import AdminTemplates from './AdminTemplates'
import AdminStats from './AdminStats'
import ScheduleScreen from '../ScheduleScreen'
import { Activity, Megaphone, Settings, Wrench, Calendar, BarChart } from '../../components/icons'

const TABS = [
  { key: 'dash', label: 'Resumen', icon: Activity },
  { key: 'horario', label: 'Horarios', icon: Calendar },
  { key: 'inc', label: 'Incidencias', icon: Wrench },
  { key: 'stats', label: 'Stats', icon: BarChart },
  { key: 'ann', label: 'Avisos', icon: Megaphone },
  { key: 'tpl', label: 'Plantillas', icon: Settings },
]

export default function AdminView() {
  const [tab, setTab] = useState('dash')
  return (
    <Screen>
      <Header subtitle="Panel de control" />
      <div className="mx-auto max-w-md px-4 pt-4">
        {tab === 'dash' && <AdminDashboard />}
        {tab === 'horario' && <ScheduleScreen editable />}
        {tab === 'inc' && <AdminIncidents />}
        {tab === 'stats' && <AdminStats />}
        {tab === 'ann' && <AdminAnnouncements />}
        {tab === 'tpl' && <AdminTemplates />}
      </div>

      <BottomNav tabs={TABS} active={tab} onChange={setTab} />
    </Screen>
  )
}
