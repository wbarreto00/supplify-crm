import fs from "node:fs";
import path from "node:path";
import { upsertCompany, upsertDeal } from "../src/lib/repository";

type ImportDeal = {
  snovDealId: number;
  companyName: string;
  title: string;
  stage: "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  value: number;
  setupValue: number;
  monthlyValue: number;
  probability: number;
  closeDate: string;
  owner: string;
  notes: string;
};

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalIndex = trimmed.indexOf("=");
    if (equalIndex < 0) continue;
    const key = trimmed.slice(0, equalIndex);
    const value = trimmed.slice(equalIndex + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  loadEnvFile(path.join(repoRoot, ".env.local"));

  const payloadPath = path.join(repoRoot, "data", "snov_import_payload.json");
  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8")) as ImportDeal[];

  let success = 0;
  let failed = 0;

  for (const [index, row] of payload.entries()) {
    try {
      const company = await upsertCompany({
        name: row.companyName,
        stage: row.stage,
        owner: row.owner,
        source: "Snov.io",
        notes: `Imported from Snov.io (deal ${row.snovDealId})`,
      });

      await upsertDeal({
        companyId: company.id,
        title: row.title,
        stage: row.stage,
        value: row.value,
        setupValue: row.setupValue,
        monthlyValue: row.monthlyValue,
        probability: row.probability,
        closeDate: row.closeDate,
        owner: row.owner,
        notes: row.notes,
      });

      success += 1;
      console.log(`[${index + 1}/${payload.length}] ok ${row.title}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${index + 1}/${payload.length}] fail ${row.title} -> ${message}`);
    }
  }

  console.log(`DONE success=${success} failed=${failed} total=${payload.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
