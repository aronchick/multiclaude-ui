/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom colors for multiclaude UI
        'mc-primary': '#6366f1',
        'mc-secondary': '#8b5cf6',
        'mc-success': '#22c55e',
        'mc-warning': '#f59e0b',
        'mc-error': '#ef4444',
      },
    },
  },
  plugins: [],
};
