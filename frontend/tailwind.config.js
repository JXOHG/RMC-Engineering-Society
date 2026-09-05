/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Sampled from the RMC Engineering Competition cover art
        cardinal: {
          DEFAULT: '#B3212C',
          50: '#FBEAEB',
          100: '#F3C7C9',
          400: '#D6323E',
          600: '#B3212C',
          700: '#8F1A23',
          900: '#5C1015',
        },
        ink: '#201F1D',
        steel: '#4A4A48',
        paper: '#FBF9F7',
      },
      fontFamily: {
        display: ['"Big Shoulders Display"', 'sans-serif'],
        body: ['"Public Sans"', 'sans-serif'],
        stamp: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
