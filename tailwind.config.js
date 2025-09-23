/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pawn360 Color Palette - Based on Leaf Green Theme
        'leaf-green': '#4CAF50',
        'pawnly-orange': '#E75A33',
        'navy-blue': '#1976D2',
        'clay-grey': '#5F6368',
        'off-white': '#F8F9FA',
        'l-grey': {
          1: '#F8F9FA',
          2: '#F5F5F5',
          3: '#EEEEEE',
          4: '#E0E0E0',
          5: '#BDBDBD',
          6: '#9E9E9E',
        },
        'd-grey': {
          1: '#757575',
          2: '#616161',
          3: '#424242',
          4: '#303030',
          5: '#212121',
          6: '#000000',
        },
        'semantic': {
          'green': '#4CAF50',
          'orange': '#FF9800',
          'red': '#F44336',
          'l-red': '#FFEBEE',
        },
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}