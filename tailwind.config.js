/** @type {import('tailwindcss').Config} */
// CONSULTORIO DR. MARCOS CEPEDA — tema de marca: azul cerebro (#5484b4) + verde hoja (#9ccc6c),
// tomado del logo. `brand` es el azul principal y se SOBRESCRIBEN las paletas heredadas del
// molde (`amber`/`pink`/`fuchsia`) a azul, de modo que todas las clases heredadas
// (amber-*, pink-*, fuchsia-*, brand-*) se recolorean a azul automáticamente.
// `verde` queda disponible como color de acento (identidad del logo).
const azul = {
  50: '#eef4fa',
  100: '#d9e6f3',
  200: '#b7cee7',
  300: '#8fb0d6',
  400: '#6c9ccc',
  500: '#5484b4',
  600: '#456f9c',
  700: '#3a5c82',
  800: '#324d6c',
  900: '#2c4159',
  950: '#1c2a3a',
}
const verde = {
  50: '#f2f8ea',
  100: '#e3f0d3',
  200: '#cbe3ac',
  300: '#b0d485',
  400: '#9ccc6c',
  500: '#86bb52',
  600: '#6b9d3f',
  700: '#527a32',
  800: '#43602c',
  900: '#395027',
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: azul,
        azul,
        verde,
        // Sobrescribir las paletas del molde para recolorear a azul de marca.
        amber: azul,
        pink: azul,
        fuchsia: azul,
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.04), 0 10px 30px -10px rgba(84,132,180,.28)',
        '3d': '0 22px 45px -12px rgba(84,132,180,.42), 0 10px 18px -8px rgba(108,156,204,.35)',
        btn: '0 10px 24px -6px rgba(84,132,180,.5)',
        gold: '0 10px 24px -6px rgba(108,156,204,.5)',
        glow: '0 0 0 4px rgba(108,156,204,.18)',
      },
      backgroundImage: {
        'brand-grad': 'linear-gradient(135deg,#6c9ccc 0%,#5484b4 45%,#456f9c 100%)',
        'gold-grad': 'linear-gradient(135deg,#6c9ccc 0%,#456f9c 100%)',
        'app-bg': 'radial-gradient(1100px 600px at 100% -10%, rgba(84,132,180,.10), transparent), radial-gradient(900px 500px at -10% 110%, rgba(156,204,108,.08), transparent)',
      },
    },
  },
  plugins: [],
}
