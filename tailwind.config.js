/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        haikyu: {
          orange: '#FF5722',
          orangeDark: '#E64A19',
          orangeLight: '#FF8A65',
          black: '#121316',
          dark: '#1c1e24',
          gray: '#2c2f38',
          lightGray: '#434753',
          yellow: '#FFD600',
          nekomaRed: '#D32F2F',
          aobaMint: '#00897B',
          courtWood: '#D7A762',
          courtWoodDark: '#B88241',
          courtBlue: '#1565C0',
          courtOrange: '#D84315',
        }
      },
      fontFamily: {
        impact: ['Impact', 'Arial Black', 'sans-serif'],
        comic: ['Bangers', 'Changa One', 'Pretendard', 'sans-serif'],
      },
      boxShadow: {
        'haikyu': '4px 4px 0px 0px rgba(0,0,0,1)',
        'haikyu-lg': '6px 6px 0px 0px rgba(0,0,0,1)',
        'haikyu-orange': '4px 4px 0px 0px #FF5722',
        'haikyu-yellow': '4px 4px 0px 0px #FFD600',
      }
    },
  },
  plugins: [],
}

