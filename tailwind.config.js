/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16161A',
        paper: '#FBF8F0',
        line: '#D9D3C4',
        muted: '#5E5B52',
        teamA: { DEFAULT: '#E9540F', soft: '#FDE7DA' },
        teamB: { DEFAULT: '#1A5DBF', soft: '#DFEAFA' },
        wood: { DEFAULT: '#EFCF9B', dark: '#DDB273' },
        alert: '#C8241B',
        ok: '#14783E',
      },
      fontFamily: {
        display: ['"Black Han Sans"', '"Noto Sans KR"', 'sans-serif'],
        body: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
