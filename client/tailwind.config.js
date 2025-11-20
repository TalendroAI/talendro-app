/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        talBlue: '#2F6DF6',
        talAqua: '#00C4CC',
        talSlate: '#2C2F38',
        talLime: '#A4F400',
        talGray: '#9FA6B2',
      },
    },
  },
  plugins: [],
}

