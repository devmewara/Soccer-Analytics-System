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
          void: '#05070B',        // Deepest black canvas
          card: '#0A0E17',        // Surface layer 1
          elevated: '#111827',    // Surface layer 2
          surface: '#141D2E',     // Surface layer 3
          border: '#1E2638',      // Default subtle border
          borderLight: '#2D3A52', // Interactive / hover border
          turf: '#071A10',        // Deep turf base
          turfStripe: '#0B2618',  // Pitch striped turf
          accent: '#10B981',      // Emerald football green
          accentHover: '#059669',
          glow: '#00E676',        // Electric turf highlight
          cyan: '#38BDF8',        // Team Sky Blue
          crimson: '#EF4444',     // Team Crimson
          ball: '#FACC15',        // Match Ball
          referee: '#A855F7',     // Referee Purple
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-green': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'glow-turf': '0 0 35px -5px rgba(0, 230, 118, 0.2)',
        'tactical': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
      }
    },
  },
  plugins: [],
};
