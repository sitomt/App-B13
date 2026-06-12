import { savePushSubscription } from './api'

// Clave pública VAPID (no es secreta). Se puede sobreescribir con VITE_VAPID_PUBLIC_KEY.
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BBqDjzIkK6qdigTlw7w_PmSTrvsnO_ZhUPB0MZ7ulvPHVtWYGV0vajwjPJ0eytjNInKkVU7bA1gUzX0vIQgmvXk'

// ¿El navegador soporta Web Push?
export function pushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// ¿La app está abierta como PWA instalada (requisito de iOS para notificaciones)?
export function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

// ¿Ya están activadas en este dispositivo?
export async function notificationsEnabled() {
  if (!pushSupported() || Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return false
  return !!(await reg.pushManager.getSubscription())
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

// Pide permiso, se suscribe y guarda la suscripción en la BD para este empleado.
// Lanza un Error con código: 'unsupported' | 'ios-install' | 'denied'.
export async function enablePush(employee) {
  if (!pushSupported()) {
    throw new Error(isIOS() && !isStandalone() ? 'ios-install' : 'unsupported')
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('denied')

  const reg = await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }
  const json = sub.toJSON()
  await savePushSubscription(employee.id, {
    endpoint: sub.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  })
  return true
}
