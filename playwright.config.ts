import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:4010",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "USE_IN_MEMORY_DB=1 ADMIN_PASSWORD=admin123 AGENT_API_KEY=dev-agent-key npm run dev -- --port 4010",
    url: "http://127.0.0.1:4010/login",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
