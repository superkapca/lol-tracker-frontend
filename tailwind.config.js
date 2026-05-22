export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      colors: {
        ink: "#070a0f",
        panel: "#101722",
        panelSoft: "#151f2d",
        line: "#263445",
        gold: "#c89b3c",
        blue: "#38a3ff",
        win: "#35d47d",
        loss: "#ff5d6c"
      },
      boxShadow: {
        game: "0 24px 80px rgba(0, 0, 0, 0.42)"
      }
    }
  },
  plugins: []
};
