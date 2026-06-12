import { useEffect, useRef, useState } from 'react'
import { haptic } from '../lib/haptics'

// Teclado numérico para PIN de 4 dígitos. Controlado por el padre:
//  - onComplete(pin): se llama al teclear el 4º dígito.
//  - resetSignal: al cambiar de valor, limpia el buffer (tras fallo o paso siguiente).
//  - shake: al pasar a true, sacude los puntos (PIN incorrecto).
//  - tone: 'dark' (sobre fondo ink, p.ej. login) | 'light' (dentro de un Sheet).
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', null, '0', 'back']

export default function PinPad({ title, subtitle, onComplete, onBack, resetSignal, shake = false, disabled = false, tone = 'dark' }) {
  const [digits, setDigits] = useState('')
  const fired = useRef(false)

  // Limpia al recibir señal de reinicio (tras fallo o paso siguiente).
  useEffect(() => { setDigits(''); fired.current = false }, [resetSignal])

  useEffect(() => {
    if (shake) haptic('error')
  }, [shake])

  // Dispara onComplete UNA sola vez al llegar a 4 dígitos.
  // (Va en un effect, no en el updater de estado, para no duplicarse en StrictMode.)
  useEffect(() => {
    if (digits.length === 4 && !fired.current) {
      fired.current = true
      onComplete(digits)
    }
  }, [digits]) // eslint-disable-line react-hooks/exhaustive-deps

  function press(k) {
    if (disabled) return
    haptic('tap')
    if (k === 'back') { setDigits((d) => d.slice(0, -1)); return }
    setDigits((d) => (d.length >= 4 ? d : d + k))
  }

  const dark = tone === 'dark'
  const dotOn = dark ? 'bg-white' : 'bg-ink'
  const dotOff = dark ? 'bg-white/20' : 'bg-ink/15'
  const keyCls = dark
    ? 'bg-white/[0.07] text-white active:bg-white/15'
    : 'bg-ink/[0.05] text-ink active:bg-ink/10'
  const titleCls = dark ? 'text-white' : 'text-ink'
  const subCls = dark ? 'text-white/45' : 'text-ink/50'

  return (
    <div className="flex flex-col items-center">
      {title && <p className={`font-display text-2xl font-extrabold ${titleCls}`}>{title}</p>}
      {subtitle && <p className={`mt-1 text-sm ${subCls}`}>{subtitle}</p>}

      {/* Puntos */}
      <div className={`mt-7 flex gap-4 ${shake ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-3.5 w-3.5 rounded-full transition-all duration-150 ${i < digits.length ? dotOn : dotOff}`} />
        ))}
      </div>

      {/* Teclado */}
      <div className="mt-9 grid w-full max-w-[18rem] grid-cols-3 gap-3">
        {KEYS.map((k, idx) => {
          if (k === null) return <span key={idx} />
          if (k === 'back') {
            return (
              <button
                key={idx}
                onClick={() => press('back')}
                aria-label="Borrar"
                disabled={disabled}
                className={`flex h-16 items-center justify-center rounded-2xl text-2xl font-bold transition active:scale-95 disabled:opacity-40 ${keyCls}`}
              >
                ⌫
              </button>
            )
          }
          return (
            <button
              key={idx}
              onClick={() => press(k)}
              disabled={disabled}
              className={`flex h-16 items-center justify-center rounded-2xl font-display text-2xl font-extrabold transition active:scale-95 disabled:opacity-40 ${keyCls}`}
            >
              {k}
            </button>
          )
        })}
      </div>

      {onBack && (
        <button onClick={onBack} className={`mt-7 text-sm font-semibold ${dark ? 'text-white/55 active:text-white/80' : 'text-ink/55 active:text-ink'}`}>
          ← Volver
        </button>
      )}
    </div>
  )
}
