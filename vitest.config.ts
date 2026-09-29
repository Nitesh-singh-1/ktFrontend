import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * TASK-013 slice 2: Vitest scaffolding for the frontend. Same pattern as the
 * backend's xUnit project — pure unit tests only, no jsdom / no full component
 * rendering yet. Adds coverage when there's enough surface area to warrant a
 * floor.
 *
 * Aliased path resolution mirrors tsconfig.json so tests can import shared
 * utilities via `@/...` and `services/...`.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    globals: false,
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      services: path.resolve(__dirname, "./services"),
    },
  },
});
