/** @type {import('tailwindcss').Config} */
// CONSULTORIO GERIÁTRICO — tema teal médico (#0d9488).
// Se redefine `brand` a teal y se SOBRESCRIBEN las paletas `amber`/`pink`/`fuchsia`
// heredadas del molde (dental/belleza) a tonos teal, de modo que todas las clases
// heredadas (amber-*, pink-*, fuchsia-*, brand-*) se recoloreen a teal automáticamente.
const teal = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6',
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e',
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: teal,
        teal,
        // Sobrescribir las paletas del molde para recolorear a teal.
        amber: teal,
        pink: teal,
        fuchsia: teal,
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 10px 30px -10px rgba(13,148,136,.28)',
        '3d': '0 22px 45px -12px rgba(13,148,136,.42), 0 10px 18px -8px rgba(20,184,166,.35)',
        btn: '0 10px 24px -6px rgba(13,148,136,.5)',
        gold: '0 10px 24px -6px rgba(20,184,166,.5)',
        glow: '0 0 0 4px rgba(20,184,166,.18)',
      },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg,#5eead4 0%,#14b8a6 45%,#0d9488 100%)',
        'gold-grad': 'linear-gradient(135deg,#2dd4bf 0%,#0d9488 100%)',
        'app-bg': 'radial-gradient(1100px 600px at 100% -10%, rgba(13,148,136,.10), transparent), radial-gradient(900px 500px at -10% 110%, rgba(20,184,166,.07), transparent)',
      },
    },
  },
  plugins: [],
}
