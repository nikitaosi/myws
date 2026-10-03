import {defineConfig} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  site: 'https://nikitaosi.dev',
  integrations: [react()],
  vite: {plugins: [tailwindcss()]},
  adapter: netlify({devFeatures: false}),
});
