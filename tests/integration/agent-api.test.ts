import { GET as searchGet } from "@/app/api/agent/search/route";
import { POST as activityPost } from "@/app/api/agent/activity/route";
import { POST as companyPost } from "@/app/api/agent/company/route";
import { POST as contactPost } from "@/app/api/agent/contact/route";
import { POST as dealPost } from "@/app/api/agent/deal/route";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

function jsonRequest(url: string, payload: unknown, apiKey = "test-agent-key") {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
}

describe("/api/agent", () => {
  it("aplica auth por API key", async () => {
    const response = await companyPost(jsonRequest("http://localhost/api/agent/company", { name: "A" }, "invalid"));
    expect(response.status).toBe(401);
  });

  it("faz upsert idempotente de company/contact/deal e cria activity", async () => {
    const companyRes1 = await companyPost(
      jsonRequest("http://localhost/api/agent/company", {
        name: "Supplify Labs",
        segment: "SaaS",
        status: "lead",
      }),
    );
    expect(companyRes1.status).toBe(200);
    const companyBody1 = await companyRes1.json();
    const companyId = companyBody1.data.id as string;

    const companyRes2 = await companyPost(
      jsonRequest("http://localhost/api/agent/company", {
        name: "Supplify Labs",
        segment: "SaaS",
        owner: "Ana",
        status: "prospect",
      }),
    );
    const companyBody2 = await companyRes2.json();
    expect(companyBody2.data.id).toBe(companyId);
    expect(companyBody2.data.owner).toBe("Ana");

    const contactRes = await contactPost(
      jsonRequest("http://localhost/api/agent/contact", {
        companyId,
        name: "João",
        email: "joao@supplify.com",
      }),
    );
    expect(contactRes.status).toBe(200);

    const contactUpsertRes = await contactPost(
      jsonRequest("http://localhost/api/agent/contact", {
        companyId,
        name: "João Silva",
        email: "joao@supplify.com",
      }),
    );
    const contactUpsertBody = await contactUpsertRes.json();
    expect(contactUpsertBody.data.name).toBe("João Silva");

    const dealRes1 = await dealPost(
      jsonRequest("http://localhost/api/agent/deal", {
        companyId,
        title: "Plano Enterprise",
        stage: "proposal",
        value: 10000,
        probability: 60,
      }),
    );
    expect(dealRes1.status).toBe(200);
    const dealBody1 = await dealRes1.json();

    const dealRes2 = await dealPost(
      jsonRequest("http://localhost/api/agent/deal", {
        companyId,
        title: "Plano Enterprise",
        stage: "negotiation",
        value: 12000,
        probability: 80,
      }),
    );
    const dealBody2 = await dealRes2.json();
    expect(dealBody2.data.id).toBe(dealBody1.data.id);
    expect(dealBody2.data.stage).toBe("negotiation");

    const activityRes = await activityPost(
      jsonRequest("http://localhost/api/agent/activity", {
        companyId,
        type: "task",
        dueDate: "2026-02-28",
        notes: "Follow-up",
      }),
    );
    expect(activityRes.status).toBe(201);

    const searchReq = new NextRequest("http://localhost/api/agent/search?q=Supplify", {
      method: "GET",
      headers: {
        "x-api-key": "test-agent-key",
      },
    });
    const searchRes = await searchGet(searchReq);
    expect(searchRes.status).toBe(200);
    const searchBody = await searchRes.json();
    expect(searchBody.data.companies.length).toBeGreaterThan(0);

    const dealSearchReq = new NextRequest("http://localhost/api/agent/search?q=Enterprise", {
      method: "GET",
      headers: {
        "x-api-key": "test-agent-key",
      },
    });
    const dealSearchRes = await searchGet(dealSearchReq);
    const dealSearchBody = await dealSearchRes.json();
    expect(dealSearchBody.data.deals.length).toBeGreaterThan(0);
  });
});
