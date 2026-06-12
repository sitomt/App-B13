import { useRef, useState } from 'react'
import CameraCapture from './CameraCapture'
import { Camera, Plus } from './icons'

// Dos formas de poner foto: hacerse un selfie (cámara in-app) o subir una de la galería.
// Llama a onPhoto(file) con el archivo elegido. tone: 'dark' (fondo ink) | 'light' (sheet).
export default function PhotoPicker({ onPhoto, tone = 'light', disabled = false }) {
  const galleryRef = useRef(null)
  const [camOpen, setCamOpen] = useState(false)

  function onGallery(e) {
    const file = e.target.files?.[0]
    if (file) onPhoto(file)
    e.target.value = '' // permite volver a elegir el mismo archivo
  }

  const base = 'flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl py-5 text-sm font-bold transition active:scale-95 disabled:opacity-50'
  const cls = tone === 'dark'
    ? `${base} bg-white/[0.08] text-white`
    : `${base} bg-ink/[0.05] text-ink`

  return (
    <>
      <div className="flex w-full gap-3">
        <button onClick={() => setCamOpen(true)} disabled={disabled} className={cls}>
          <Camera size={26} /> Hacer selfie
        </button>
        <button onClick={() => galleryRef.current?.click()} disabled={disabled} className={cls}>
          <Plus size={26} /> Subir foto
        </button>
      </div>
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={onGallery} />
      <CameraCapture open={camOpen} onClose={() => setCamOpen(false)} onCapture={(file) => { setCamOpen(false); onPhoto(file) }} />
    </>
  )
}
