/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FFFDF7',
          100: '#FFFDF0',
          200: '#FAF6E8',
          300: '#F5EFE0',
          400: '#EDE5D0',
          500: '#E0D5B8',
        },
        beige: {
          50: '#F9F6F0',
          100: '#F2EDE3',
          200: '#E8E0D0',
          300: '#DDD2BE',
          400: '#C9BCA0',
          500: '#B5A885',
        },
        sage: {
          50: '#F0F5EC',
          100: '#DCE8D2',
          200: '#B9CEA6',
          300: '#97B67E',
          400: '#7B9E5F',
          500: '#688A4D',
          600: '#547140',
          700: '#3F5630',
          800: '#2D3D22',
          900: '#1A2412',
        },
        terracotta: {
          50: '#FBF0EB',
          100: '#F5D9CC',
          200: '#E8B39A',
          300: '#DB8E6B',
          400: '#C97B5A',
          500: '#B06343',
          600: '#8E4E35',
          700: '#6D3A28',
          800: '#4D2818',
          900: '#2E1810',
        },
        charcoal: {
          50: '#F5F4F2',
          100: '#E8E5E1',
          200: '#C9C4BE',
          300: '#A8A29A',
          400: '#7A736B',
          500: '#5C554D',
          600: '#3D3833',
          700: '#2D2925',
          800: '#1E1B18',
          900: '#0F0D0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
