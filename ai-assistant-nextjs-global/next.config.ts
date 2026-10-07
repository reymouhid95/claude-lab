import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // No cacheComponents/ISR: every route here is dynamic (chat, journal,
  // analyses) and vinext would otherwise require a KV cache adapter.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
