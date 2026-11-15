import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run dev` (bash run_app.sh) serves the app at "/". The production build is served by
// GitHub Pages at https://apriljwalter-lgtm.github.io/judge_the_sample/, so the build (and
// `vite preview` of it) uses that sub-path.
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  base: command === "build" || isPreview ? "/judge_the_sample/" : "/",
}));
