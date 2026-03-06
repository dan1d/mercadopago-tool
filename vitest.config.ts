import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    exclude: ["packages/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/landing.ts", "src/privacy.ts", "src/terms.ts", "src/global.d.ts"],
      reporter: ["text", "text-summary", "lcov"],
    },
  },
});
