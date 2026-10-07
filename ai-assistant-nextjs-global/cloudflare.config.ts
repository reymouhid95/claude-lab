import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "ai-assistant-nextjs-global",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-07",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    env: {
      ASSETS: bindings.assets(),
      // Agent memory + shot journal (D1, region WEUR).
      DB: bindings.d1({ id: "2162467d-db83-4b5d-bfc0-e172865b6eee", name: "ai-assistant" }),
      // Uploaded reference frames (R2, shared with PromptLens under a prefix).
      FRAMES: bindings.r2({ name: "promptlens-frames" }),
      // Gemini key: .dev.vars locally, `cf secret put` in production.
      GEMINI_API_KEY: bindings.secret(),
    },
  }),
});
