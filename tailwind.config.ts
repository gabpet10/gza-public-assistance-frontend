import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08131f",
        sand: "#f3efe6",
        ember: "#d95f43",
        ocean: "#0f6d7a",
        moss: "#7a8b52",
      },
      boxShadow: {
        panel: "0 18px 50px rgba(8, 19, 31, 0.12)",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(217, 95, 67, 0.18), transparent 34%), radial-gradient(circle at top right, rgba(15, 109, 122, 0.15), transparent 32%), linear-gradient(180deg, #f8f4eb 0%, #f3efe6 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
