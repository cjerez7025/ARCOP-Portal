/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans:    ['"Inter"',             'system-ui', 'sans-serif'],
      },
      colors: {
        corp: {
          navy:   '#0A2463',
          navylt: '#1A3A7A',
          blue:   '#1D4ED8',
          bluelt: '#2563EB',
          cyan:   '#0EA5E9',
          cyanlt: '#38BDF8',
          bg:     '#F3F4F6',
          bgcard: '#FFFFFF',
          border: '#E5E7EB',
          text:   '#111827',
          muted:  '#6B7280',
          subtle: '#9CA3AF',
        },
        status: {
          pending: '#F59E0B',
          active:  '#3B82F6',
          process: '#8B5CF6',
          done:    '#10B981',
          closed:  '#6B7280',
          error:   '#EF4444',
        },
      },
      boxShadow: {
        'corp-sm':  '0 1px 3px rgba(10,36,99,0.08), 0 1px 2px rgba(10,36,99,0.05)',
        'corp-md':  '0 4px 12px rgba(10,36,99,0.10), 0 2px 6px rgba(10,36,99,0.06)',
        'corp-lg':  '0 8px 24px rgba(10,36,99,0.12), 0 4px 12px rgba(10,36,99,0.08)',
        'corp-btn': '0 2px 4px rgba(29,78,216,0.25), 0 1px 2px rgba(29,78,216,0.15)',
        'corp-nav': '0 4px 16px rgba(10,36,99,0.20)',
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}