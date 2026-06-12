import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SessionProvider } from './state/session'
import { ToastProvider } from './components/Toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SessionProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </SessionProvider>
  </React.StrictMode>,
)

// Service worker para Web Push (notificaciones tipo banner en el móvil).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* sin SW, la app sigue funcionando */ })
  })
}
