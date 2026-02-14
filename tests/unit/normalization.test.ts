import { clamp, normalizeEmail, normalizeKey, parseBoolean } from "@/lib/normalization";
import { describe, expect, it } from "vitest";

describe("normalization", () => {
  it("normaliza chaves e email", () => {
    expect(normalizeKey("  AcMe Corp  ")).toBe("acme corp");
    expect(normalizeEmail("  USER@EXAMPLE.COM ")).toBe("user@example.com");
  });

  it("interpreta booleanos de formulário", () => {
    expect(parseBoolean("on")).toBe(true);
    expect(parseBoolean("true")).toBe(true);
    expect(parseBoolean("0")).toBe(false);
  });

  it("clamp mantém limites", () => {
    expect(clamp(110, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
    expect(clamp(40, 0, 100)).toBe(40);
  });
});
