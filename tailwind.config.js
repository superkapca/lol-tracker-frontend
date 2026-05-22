export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#17130c",
        surface: "#17130c",
        "surface-dim": "#17130c",
        "surface-bright": "#3e3831",
        "surface-container-lowest": "#110e08",
        "surface-container-low": "#1f1b14",
        "surface-container": "#231f18",
        "surface-container-high": "#2e2922",
        "surface-container-highest": "#39342c",
        "surface-variant": "#39342c",
        "on-surface": "#ebe1d6",
        "on-surface-variant": "#d2c5b1",
        "on-background": "#ebe1d6",
        outline: "#9b8f7d",
        "outline-variant": "#4e4637",
        primary: "#f0bf5c",
        "primary-container": "#c89b3c",
        "primary-fixed": "#ffdea4",
        "on-primary": "#412d00",
        "on-primary-container": "#4b3500",
        secondary: "#bac6e7",
        "secondary-container": "#3d4964",
        "on-secondary-container": "#acb8d8",
        error: "#ffb4ab",
        "error-container": "#93000a",
        win: "#3b82f6",
        loss: "#ef4444"
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
      spacing: {
        xs: "4px",
        unit: "4px",
        sm: "8px",
        gutter: "12px",
        margin: "16px",
        md: "16px",
        lg: "24px",
        xl: "32px"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        "display-lg": ["Inter"],
        "headline-md": ["Inter"],
        "headline-sm": ["Inter"],
        "body-md": ["Inter"],
        "body-sm": ["Inter"],
        "label-caps": ["Inter"],
        "stat-lg": ["Inter"],
        "stat-sm": ["Inter"]
      },
      fontSize: {
        "display-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "label-caps": ["10px", { lineHeight: "12px", letterSpacing: "0.06em", fontWeight: "700" }],
        "stat-lg": ["18px", { lineHeight: "22px", fontWeight: "700" }],
        "stat-sm": ["13px", { lineHeight: "16px", fontWeight: "600" }]
      }
    }
  },
  plugins: []
};
