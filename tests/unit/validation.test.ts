import {
  activityInputSchema,
  agentDealSchema,
  companyInputSchema,
  contactInputSchema,
  dealInputSchema,
} from "@/lib/validation";
import { describe, expect, it } from "vitest";

describe("validation schemas", () => {
  it("valida company", () => {
    const parsed = companyInputSchema.parse({
      name: "  Supplify  ",
      stage: "new",
      notes: "test",
    });

    expect(parsed.name).toBe("Supplify");
    expect(parsed.stage).toBe("new");
  });

  it("valida contact", () => {
    const parsed = contactInputSchema.parse({
      companyId: "cmp_1",
      name: "Maria",
      email: "maria@example.com",
    });

    expect(parsed.email).toBe("maria@example.com");
  });

  it("normaliza deal numérico", () => {
    const parsed = dealInputSchema.parse({
      companyId: "cmp_1",
      title: "Plano anual",
      stage: "proposal",
      value: "2500",
      probability: "140",
      closeDate: "2026-03-10",
    });

    expect(parsed.value).toBe(2500);
    expect(parsed.probability).toBe(100);
  });

  it("valida activity", () => {
    const parsed = activityInputSchema.parse({
      companyId: "cmp_1",
      type: "task",
      done: "on",
      dueDate: "2026-02-20",
    });

    expect(parsed.done).toBe(true);
    expect(parsed.type).toBe("task");
  });

  it("falha sem referência de company no agent deal", () => {
    const parsed = agentDealSchema.safeParse({
      title: "Deal X",
      stage: "new",
    });

    expect(parsed.success).toBe(false);
  });
});
