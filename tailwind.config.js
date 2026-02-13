/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hytale: {
          bg: '#1a1a1a',
          sidebar: '#252525',
          panel: '#2d2d2d',
          accent: '#c8a45d', // Gold-ish accent color for Hytale theme
          text: '#e0e0e0',
          muted: '#888888',
        }
      }
    },
  },
  plugins: [],
}
