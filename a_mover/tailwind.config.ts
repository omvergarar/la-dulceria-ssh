import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#fbddf9',
          dark: '#f5bef2',
          deeper: '#e89ee4',
        },
        accent: {
          DEFAULT: '#c96bc4',
          dark: '#a3509e',
        },
        text: {
          dark: '#2d1a2b',
          medium: '#5a3d58',
          light: '#9a7898',
        },
        bg: {
          soft: '#fef6fe',
          cream: '#fffaff',
        },
        dulce: {
          green: '#4caf7d',
          yellow: '#f0b429',
          red: '#e53e3e',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '18px',
        lg: '10px',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(201,107,196,0.12)',
        card: '0 2px 16px rgba(45,26,43,0.08)',
        hover: '0 8px 32px rgba(201,107,196,0.22)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        pulse_wa: 'pulse_wa 2s infinite',
        'fade-in': 'fadeIn 0.7s ease forwards',
        'pop-in': 'popIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-18px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pulse_wa: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(37,211,102,0.5)' },
          '50%': { transform: 'scale(1.08)', boxShadow: '0 0 0 10px rgba(37,211,102,0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
