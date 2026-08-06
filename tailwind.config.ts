import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0b1020',
          secondary: '#161c2d',
          tertiary: '#1f283d',
          border: '#293147',
        },
        accent: {
          purple: '#8b5cf6',
          blue: '#3b82f6',
        }
      },
      boxShadow: {
        glass: '0 20px 60px rgba(0,0,0,0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseDot: {
          '0%, 80%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
          '40%': { opacity: '1', transform: 'translateY(-1px)' }
        },
        typingCursor: {
          '0%, 45%, 100%': { opacity: '0' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out both',
        pulseDot: 'pulseDot 1.2s infinite ease-in-out',
        typingCursor: 'typingCursor 0.9s infinite ease-in-out'
      }
    }
  },
  plugins: []
};

export default config;
