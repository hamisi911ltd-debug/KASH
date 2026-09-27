import { defineConfig } from "vitest/config";

// Kept separate from vite.config.js so tests don't load the React/single-file
// build plugins. Everything under test is plain JS that runs in Node.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
  },
});
