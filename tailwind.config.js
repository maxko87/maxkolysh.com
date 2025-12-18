/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#667eea',
        'primary-hover': '#5568d3',
        'primary-light': '#e0e7ff',
        secondary: '#764ba2',
      },
      maxWidth: {
        'content': '680px',
      },
    },
  },
  plugins: [],
}
