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
