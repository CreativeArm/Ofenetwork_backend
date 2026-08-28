import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09111f",
        ocean: "#0f4c81",
        mist: "#edf5ff",
        gold: "#d6a94f",
        mint: "#3eb489"
      }
    }
  },
  plugins: [],
};

export default config;
