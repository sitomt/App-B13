import { useCallback, useEffect, useRef, useState } from 'react'

// Hook genérico de carga asíncrona con refresco manual y opcional por intervalo.
// Devuelve { data, loading, error, reload }.
export function useData(fn, deps = [], { interval = 0 } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fnRef.current()
      setData(res)
      setError(null)
    } catch (e) {
      setError(e)
      // eslint-disable-next-line no-console
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (!interval) return
    const id = setInterval(() => reload(true), interval)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, ...deps])

  return { data, loading, error, reload }
}
