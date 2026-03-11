/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ucl: {
          bg: '#020C2B',
          surface: '#071235',
          card: '#0A1F44',
          card2: '#132B6B',
          line: '#244AA5',
          accent: '#00E5FF',
          accent2: '#2FD3FF',
          blue: '#007BFF',
          silver: '#C9D1E5',
          text: '#EAF2FF',
          muted: '#8FA8D8',
          success: '#22C55E',
          warning: '#FACC15',
          danger: '#EF4444',
          glow: '#4AD9FF',
          platinum: '#F2F6FF',
          divider: '#2E4CC2',
          hover: '#1B3A8A',
          qualified: '#22C55E',
          playoff: '#FACC15',
          eliminated: '#EF4444',
        },
      },
      boxShadow: {
        'ucl-sm': '0 0 0 1px rgba(74,217,255,0.10), 0 8px 24px rgba(2,12,43,0.35)',
        'ucl-md': '0 0 0 1px rgba(74,217,255,0.16), 0 12px 36px rgba(2,12,43,0.45)',
        'ucl-glow': '0 0 18px rgba(0,229,255,0.28)',
        'ucl-glow-lg': '0 0 32px rgba(0,229,255,0.22)',
        broadcast: '0 28px 90px rgba(2, 12, 43, 0.58)',
        neon: '0 0 0 1px rgba(74, 217, 255, 0.24), 0 0 34px rgba(0, 229, 255, 0.2)',
        cyan: '0 0 10px rgba(0, 229, 255, 0.8)',
      },
      backgroundImage: {
        'ucl-card': 'linear-gradient(180deg, rgba(19,43,107,0.92) 0%, rgba(10,31,68,0.96) 100%)',
        'ucl-panel': 'linear-gradient(180deg, rgba(10,31,68,0.90) 0%, rgba(7,18,53,0.96) 100%)',
        'ucl-border': 'linear-gradient(135deg, rgba(0,229,255,0.55), rgba(47,211,255,0.08), rgba(201,209,229,0.20))',
        'ucl-page': 'radial-gradient(circle at center, #162C7B 0%, #0A1F44 40%, #020C2B 100%)',
        'stadium-glow': 'radial-gradient(circle at top, rgba(0, 229, 255, 0.16), transparent 38%), linear-gradient(180deg, rgba(7, 18, 53, 0.84), rgba(22, 44, 123, 0.16))',
      },
      borderRadius: {
        ucl: '1.25rem',
        'ucl-lg': '1.75rem',
      },
    },
  },
  plugins: [],
};
