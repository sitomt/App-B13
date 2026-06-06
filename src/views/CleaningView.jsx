import { useState } from 'react'
import { Header, Screen } from '../components/AppShell'
import BottomNav from '../components/BottomNav'
import ScheduleOverlay from '../components/ScheduleOverlay'
import CleaningToday from './cleaning/CleaningToday'
import CleaningStats from './cleaning/CleaningStats'
import { Map, BarChart } from '../components/icons'

const TABS = [
  { key: 'ruta', label: 'Ruta', icon: Map },
  { key: 'stats', label: 'Estadísticas', icon: BarChart },
]
const SUBTITLE = { ruta: 'Tu ruta', stats: 'Estadísticas' }

export default function CleaningView() {
  const [tab, setTab] = useState('ruta')
  const [schedule, setSchedule] = useState(false)

  if (schedule) return <ScheduleOverlay onClose={() => setSchedule(false)} />

  return (
    <Screen>
      <Header subtitle={SUBTITLE[tab]} onCalendar={() => setSchedule(true)} />

      <div className="mx-auto max-w-md px-4 pt-4">
        {tab === 'ruta' && <CleaningToday />}
        {tab === 'stats' && <CleaningStats />}
      </div>

      <BottomNav tabs={TABS} active={tab} onChange={setTab} />
    </Screen>
  )
}
