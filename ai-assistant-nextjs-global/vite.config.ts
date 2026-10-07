import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // The Personal-OS vault lives outside this project (public repo: the notes
  // are inlined at build time, never committed) — allow reading it in dev.
  server: { fs: { allow: ["../.."] } },
  plugins: [
    // The Next setup compiled Tailwind through a Turbopack loader, which Vite
    // ignores — this plugin is the Vite equivalent.
    tailwindcss(),
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
