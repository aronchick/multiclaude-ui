/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Multiclaude brand colors
        mc: {
          primary: '#3B82F6', // Blue
          secondary: '#10B981', // Green
          accent: '#8B5CF6', // Purple
          warning: '#F59E0B', // Amber
          error: '#EF4444', // Red
          dark: '#1F2937', // Gray-800
          light: '#F3F4F6', // Gray-100
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
