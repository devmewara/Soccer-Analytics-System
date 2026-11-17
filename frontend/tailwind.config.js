/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: '#070A0F',     // Pitch night deepest black-navy
          card: '#0D131F',     // Slate navy card background
          border: '#1E293B',   // Border slate
          accent: '#10B981',   // Football pitch emerald green
          accentHover: '#059669',
          glow: '#00FF87',     // Neon pitch turf glow
          neonBlue: '#38BDF8', // Cyan accent
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
