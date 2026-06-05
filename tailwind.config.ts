import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        rosewood: "#b75d69",
        coral: "#f28482",
        mint: "#6bbf9c",
        ink: "#26262b",
        cloud: "#f7f7f4"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(38, 38, 43, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
