/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./views/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./ui/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#050505', // Deep Obsidian
        surface: '#0F1115',    // Charcoal
        card: '#13131A',       // Slightly lighter charcoal for cards
        primary: '#6366f1',    // Indigo-500 (Neon Purple-ish)
        secondary: '#64748b',  // Slate-500
        success: '#10b981',    // Emerald-500
        warning: '#f59e0b',    // Amber-500
        error: '#ef4444',      // Red-500
        accent: '#8b5cf6',     // Violet-500
        'neon-blue': '#3b82f6',
        'neon-purple': '#8b5cf6',
        'neon-green': '#10b981',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'neon-glow': 'conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)',
      },
      boxShadow: {
        'neon': '0 0 20px -5px rgba(139, 92, 246, 0.15)',
        'glow': '0 0 40px -10px rgba(59, 130, 246, 0.3)',
      }
    }
  },
  plugins: [],
}