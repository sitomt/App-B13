import { createContext, useContext, useEffect, useState } from 'react'

// Sesión SIMULADA: no hay login real todavía. Guardamos el empleado
// "activo" para poder entrar/salir de cada rol al instante. Se sustituirá
// por Supabase Auth + PIN más adelante.
const SessionCtx = createContext(null)
const STORAGE_KEY = 'b13.session.employee'

export function SessionProvider({ children }) {
  const [employee, setEmployee] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (employee) localStorage.setItem(STORAGE_KEY, JSON.stringify(employee))
    else localStorage.removeItem(STORAGE_KEY)
  }, [employee])

  const login = (emp) => setEmployee(emp)
  const logout = () => setEmployee(null)

  return (
    <SessionCtx.Provider value={{ employee, login, logout }}>
      {children}
    </SessionCtx.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider')
  return ctx
}
