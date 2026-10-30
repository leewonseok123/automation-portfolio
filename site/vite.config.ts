import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// base: "./" → GitHub Pages 하위 경로(/repo-name/)에서도 그대로 동작
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
