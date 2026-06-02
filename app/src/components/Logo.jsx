// El logotipo positivo es oscuro sobre transparente. Para fondos oscuros
// lo renderizamos en blanco con un filtro (criterio del manual: blanco o negro).

export function Wordmark({ variant = 'dark', className = '' }) {
  return (
    <img
      src="/brand/logo.png"
      alt="Baktun 13 Sports Center"
      className={`${variant === 'white' ? 'logo-white' : ''} ${className}`}
      draggable={false}
    />
  )
}

export function Symbol({ variant = 'dark', className = '' }) {
  return (
    <img
      src={variant === 'white' ? '/brand/symbol-white.png' : '/brand/symbol-dark.png'}
      alt="Baktun 13"
      className={className}
      draggable={false}
    />
  )
}
