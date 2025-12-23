import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@battle": path.resolve(__dirname, "./src/battle"),
      "@cards": path.resolve(__dirname, "./src/cards"),
      "@effects": path.resolve(__dirname, "./src/effects"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@static": path.resolve(__dirname, "./src/static"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
});
