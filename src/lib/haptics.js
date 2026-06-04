// Feedback háptico para confirmaciones y acciones importantes (skill §2 haptic-feedback).
// Wrapper sobre la Vibration API; no-op silencioso donde no exista (iOS Safari, escritorio).
// Respeta prefers-reduced-motion: si el usuario pide menos movimiento, no vibramos.

const canVibrate = () =>
  typeof navigator !== 'undefined' &&
  typeof navigator.vibrate === 'function' &&
  !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const PATTERNS = {
  tap: 10, // toque ligero (marcar, navegar)
  success: [12, 40, 18], // confirmación positiva (fichaje, tarea hecha)
  error: [40, 30, 40], // algo falló
  warning: 24, // acción sensible (salida, borrado)
}

export function haptic(kind = 'tap') {
  if (!canVibrate()) return
  try {
    navigator.vibrate(PATTERNS[kind] ?? PATTERNS.tap)
  } catch {
    /* ignorar: háptica es accesoria */
  }
}
