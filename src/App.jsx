import { useSession } from './state/session'
import RoleSwitcher from './views/RoleSwitcher'
import CoachView from './views/CoachView'
import CleaningView from './views/CleaningView'
import MaintenanceView from './views/MaintenanceView'
import AdminView from './views/admin/AdminView'

export default function App() {
  const { employee } = useSession()

  if (!employee) return <RoleSwitcher />

  switch (employee.role) {
    case 'coach': return <CoachView />
    case 'cleaning': return <CleaningView />
    case 'maintenance': return <MaintenanceView />
    case 'admin': return <AdminView />
    default: return <RoleSwitcher />
  }
}
