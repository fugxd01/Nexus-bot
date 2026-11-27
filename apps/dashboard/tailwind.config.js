/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#090a0f',
        card: '#0f111a',
        'card-border': '#1e2235',
        primary: {
          DEFAULT: '#7c3aed', // Purple accent
          hover: '#6d28d9',
          light: '#8b5cf6'
        },
        electric: {
          DEFAULT: '#00d2ff', // Electric blue
          hover: '#00b4db',
          dark: '#0a84ff'
        },
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};
