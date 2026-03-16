module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../layouts/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FE8901", // your orange
        secondary: "#1E1E1E", // example dark background
      },
    },
  },
  plugins: [],
};