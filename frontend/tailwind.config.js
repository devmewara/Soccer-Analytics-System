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
          bg: '#080B10',          // Main dark background
          surface: '#101722',     // Primary surface
          elevated: '#17212E',    // Elevated surface / cards
          highlight: '#1E2B3C',   // Hover / active layer
          border: '#253244',      // Standard crisp border
          borderSubtle: '#1C2634',// Very subtle divider
          turf: '#0B1B13',        // Muted realistic pitch grass base
          turfStripe: '#0E2419',  // Alternating grass stripes
          accent: '#10B981',      // Restrained football-pitch emerald
          accentHover: '#059669',
          sky: '#38BDF8',         // Muted sky blue (Team A / Telemetry)
          crimson: '#EF4444',     // Muted crimson red (Team B)
          amber: '#F59E0B',       // Muted amber (Demo badges & warnings)
          textPrimary: '#F8FAFC', // Off-white crisp text
          textSecondary: '#94A3B8', // Clean muted grey
          textMuted: '#64748B',   // Darker technical labels
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'modal': '0 20px 40px -10px rgba(0, 0, 0, 0.8)',
      }
    },
  },
  plugins: [],
};
