import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3001",
    browserName: "chromium",
  },
  webServer: {
    command: "DATABASE_PATH=data/test.db npm run dev -- -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: false,
  },
});
