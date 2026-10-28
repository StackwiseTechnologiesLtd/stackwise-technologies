#!/usr/bin/env node
/**
 * Test Growth HTTP APIs with GROWTH_CONNECTOR_SECRET (Bearer).
 * Usage: node scripts/growth-api-test.mjs [leads|inbox|harvest-linkedin|harvest-x]
 */
import { loadEnvLocal } from "./lib/load-env-local.mjs";

loadEnvLocal();

const secret =
  process.env.GROWTH_CONNECTOR_SECRET?.trim() ||
  process.env.INTEGRATIONS_INGEST_SECRET?.trim();

if (!secret || secret.length < 32) {
  console.error("Set GROWTH_CONNECTOR_SECRET or INTEGRATIONS_INGEST_SECRET in .env.local");
  process.exit(1);
}

const base = (process.env.GROWTH_API_BASE ?? "http://localhost:3000").replace(/\/$/, "");
const cmd = process.argv[2] ?? "leads";

const headers = {
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
};

async function getLeads() {
  const res = await fetch(`${base}/api/admin/growth/leads?minScore=45`, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  const real = json.leads.filter((l) => {
    return true;
  });
  console.log(`GET leads: ${json.leads.length} total (minScore 45+)`);
  const withUrl = await fetch(`${base}/api/admin/growth/inbox?minScore=0&freshnessHours=0`, { headers });
  const inbox = await withUrl.json();
  if (withUrl.ok && inbox.items) {
    const nonDemo = inbox.items.filter(
      (i) =>
        i.signal?.sourceUrl &&
        !i.signal.sourceUrl.includes("example.com"),
    );
    console.log(`GET inbox: ${inbox.items.length} items, ${nonDemo.length} with real source URLs`);
    for (const item of nonDemo.slice(0, 5)) {
      console.log(
        `  ${item.lead.compositeScore}% ${item.lead.leadSource} ${item.lead.fullName?.slice(0, 35)} → ${item.signal?.sourceUrl?.slice(0, 70)}`,
      );
    }
  }
  return json.leads.length;
}

async function runHarvest(platform) {
  console.log(`POST harvest ${platform} (stream)…`);
  const res = await fetch(`${base}/api/admin/growth/harvest?stream=1`, {
    method: "POST",
    headers: {
      ...headers,
      Accept: "application/x-ndjson",
    },
    body: JSON.stringify({ platform }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status} ${t}`);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No body");
  const dec = new TextDecoder();
  let buf = "";
  let complete = null;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      const ev = JSON.parse(line);
      if (ev.type === "progress") {
        console.log(`  [${ev.phase}] ${ev.message}`);
      } else if (ev.type === "complete") {
        complete = ev;
      } else if (ev.type === "error") {
        throw new Error(ev.message);
      }
    }
  }
  console.log("\nHarvest complete:", complete);
  return complete;
}

try {
  if (cmd === "leads") {
    await getLeads();
  } else if (cmd === "harvest-linkedin") {
    await runHarvest("linkedin");
    console.log("\n--- After harvest ---");
    await getLeads();
  } else if (cmd === "harvest-x") {
    await runHarvest("x");
    console.log("\n--- After harvest ---");
    await getLeads();
  } else {
    console.error("Usage: growth-api-test.mjs [leads|harvest-linkedin|harvest-x]");
    process.exit(1);
  }
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
