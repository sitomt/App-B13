// Contenido inicial de "Utilidades" (manuales, políticas, accesos, contactos…).
// De momento vive en el código; cuando se conecte la base de datos pasará a la
// tabla `utilities` y será editable por el admin desde la propia app.
// Edita libremente estos textos: usa saltos de línea normales.

export const UTILITIES_CATEGORIES = [
  'Manuales y protocolos',
  'Políticas',
  'Accesos y contraseñas',
  'Reuniones',
  'Contactos útiles',
]

export const UTILITIES = [
  {
    id: 'cod-operativo',
    category: 'Manuales y protocolos',
    title: 'Código operativo de los monitores',
    body: `Cómo trabajamos en Baktun 13.

1. Imagen y actitud
- Uniforme limpio y completo. Sonrisa y trato cercano.
- El móvil solo para tareas de la app, nunca a la vista del socio.

2. En sala
- Saluda a cada socio que entra.
- Corrige técnica con respeto; prioriza la seguridad.
- Mantén el material recogido y la sala ordenada.

3. Recepción
- Toda alta o duda de pago se deriva a recepción.
- Atiende el teléfono antes del tercer tono.

(Edita este texto con vuestro código real.)`,
  },
  {
    id: 'trato-cliente',
    category: 'Manuales y protocolos',
    title: 'Trato al cliente',
    body: `Nuestra forma de tratar a los socios.

- Cercanía y profesionalidad: nombre del socio siempre que se pueda.
- Ante una queja: escuchar, disculparse, resolver o derivar. Nunca discutir.
- Despedida: agradece la visita e invita a volver.

(Edita este texto con vuestras pautas.)`,
  },
  {
    id: 'apertura-cierre',
    category: 'Manuales y protocolos',
    title: 'Protocolo de apertura y cierre',
    body: `Resumen del protocolo (el checklist detallado está en la agenda del coach).

Apertura: alarma, luces, aires, música, ordenadores, rack, revisar aseos.
Cierre: cuadre de caja, recoger material, apagar todo, cerrar y conectar alarma.`,
  },
  {
    id: 'politica-cobros',
    category: 'Políticas',
    title: 'Política de cobros',
    body: `Cómo gestionamos los cobros.

- Cuotas: se pasan el día 1 de cada mes.
- Recibo devuelto: se avisa al socio y se reintenta en 48h.
- Altas: matrícula + primera cuota en el momento del alta.
- Devoluciones: según condiciones del contrato.

(Edita con vuestra política real.)`,
  },
  {
    id: 'accesos',
    category: 'Accesos y contraseñas',
    title: 'Contraseñas y accesos',
    body: `⚠️ Uso interno. No compartir fuera del equipo.

- WiFi staff: _____
- WiFi socios: _____
- Software de recepción: usuario _____ / clave _____
- Música (Spotify/sistema): _____
- Cámaras: _____
- Email del club: _____

(Rellena con los accesos reales cuando esto sea editable desde la app.)`,
  },
  {
    id: 'contactos',
    category: 'Contactos útiles',
    title: 'Contactos y teléfonos',
    body: `Teléfonos útiles.

- Emergencias: 112
- Mantenimiento externo: _____
- Limpieza: _____
- Proveedor de material: _____
- Administración / gestoría: _____`,
  },
]
