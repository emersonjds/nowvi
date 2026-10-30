import { defineConfig } from "vitest/config";

import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    env: {
      NEXT_PUBLIC_API_URL: "https://api.nowvi.test",
      NEXT_PUBLIC_SITE_URL: "https://nowvi.test",
      NEXT_PUBLIC_ADSTERRA_BANNER_KEY: "adsterra-test-key",
    },
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/app/_components/**", "src/i18n/**"],
      exclude: ["src/app/_components/brand-logo.tsx"],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
