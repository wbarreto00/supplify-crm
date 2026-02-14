import { clearRateLimitBuckets } from "@/lib/rate-limit";
import { resetInMemoryDb } from "@/lib/sheets";
import { beforeEach } from "vitest";

process.env.USE_IN_MEMORY_DB = "1";
process.env.AGENT_API_KEY = process.env.AGENT_API_KEY ?? "test-agent-key";
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? "test-session-secret";

beforeEach(() => {
  resetInMemoryDb();
  clearRateLimitBuckets();
});
