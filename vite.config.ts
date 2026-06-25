import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Telegram Mini App обычно раздаётся как статика по HTTPS.
// base: "./" — чтобы пути работали при размещении в подпапке.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: true, // удобно тестировать с телефона по локальной сети / ngrok
    port: 5173,
  },
});
