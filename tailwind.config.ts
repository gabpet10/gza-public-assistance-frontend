import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14202b",
        sand: "#f4f7fa",
        ember: "#f28c28",
        ocean: "#1e8fa6",
        moss: "#3f7f66",
      },
      boxShadow: {
        panel: "0 16px 40px rgba(11, 58, 83, 0.1)",
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at 12% 6%, rgba(242, 140, 40, 0.15), transparent 34%), radial-gradient(circle at 88% 0%, rgba(30, 143, 166, 0.14), transparent 32%), linear-gradient(180deg, #f9fbfd 0%, #f1f5f8 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
