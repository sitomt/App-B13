/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad Baktun 13 (Manual de marca)
        ink: {
          DEFAULT: '#2C2925', // Pantone Black C — negro-marrón corporativo
          soft: '#3A352F',    // superficies elevadas sobre fondo oscuro
          line: '#4A443C',    // bordes sutiles en oscuro
        },
        sand: {
          DEFAULT: '#F4F1EC', // arena clara — fondo principal claro
          50: '#FAF8F4',
          100: '#F4F1EC',
          200: '#E9E3D9',
          300: '#D9CFC0',
        },
        bronze: {
          DEFAULT: '#B98A5E', // acento cálido (logo proyectado sobre pared)
          dark: '#A4774C',
          soft: '#E7D8C5',
        },
        // Estados, terrosos pero legibles
        sage: '#5E8C61',   // hecho / activo
        terracotta: '#B4503C', // urgente / incidencia
        ochre: '#C99A3E',  // pendiente / atención
        stone: '#5B7A8C',  // info
      },
      fontFamily: {
        display: ['"Darker Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      // Escala de elevación coherente (skill §4 elevation-consistent)
      boxShadow: {
        card: '0 1px 2px rgba(44,41,37,0.04), 0 8px 24px -12px rgba(44,41,37,0.18)',
        pop: '0 4px 16px -6px rgba(44,41,37,0.22)',
        float: '0 12px 32px -8px rgba(44,41,37,0.35)',
        sheet: '0 -8px 40px -12px rgba(44,41,37,0.45)',
      },
      // Tokens de movimiento unificados (skill §7 motion-consistency)
      transitionTimingFunction: {
        // entrada suave (decelerada) y salida acelerada
        enter: 'cubic-bezier(0.22,1,0.36,1)',
        exit: 'cubic-bezier(0.4,0,1,1)',
        spring: 'cubic-bezier(0.34,1.56,0.64,1)',
      },
      transitionDuration: {
        enter: '200ms',
        exit: '140ms', // ~70% del enter (skill exit-faster-than-enter)
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'pop': {
          '0%': { transform: 'scale(0.92)' },
          '60%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
        // entrada de ítems de lista (transform/opacity, sin reflow)
        'rise-in': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        // destello de celebración al completar
        'flash': {
          '0%': { opacity: 0, transform: 'scale(0.6)' },
          '40%': { opacity: 0.9 },
          '100%': { opacity: 0, transform: 'scale(2.4)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
        // sacudida al fallar (PIN incorrecto)
        'shake': {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-8px)' },
          '40%,80%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.28s cubic-bezier(0.22,1,0.36,1)',
        'fade-in': 'fade-in 0.2s ease-out',
        'pop': 'pop 0.25s ease-out',
        'rise-in': 'rise-in 0.32s cubic-bezier(0.22,1,0.36,1) both',
        'flash': 'flash 0.6s ease-out forwards',
        'shimmer': 'shimmer 1.4s infinite',
        'shake': 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
