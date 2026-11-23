module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#F59A16",      // PAJASA orange (buttons, active states)
        brandhover: "#E08905",
        accent: "#A85A00",     // darker orange for links/text on white (readable contrast)
        charcoal: "#3F3F3F",
        wpdark: "#1F1F23",     // top bar / sidebar
        wpdark2: "#2E2E33",
        wpbg: "#FAFAF8",
      },
      fontFamily: { sans: ["'Plus Jakarta Sans'", "system-ui", "-apple-system", "sans-serif"] },
    },
  },
  plugins: [],
};
