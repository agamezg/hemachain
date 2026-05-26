import type Anthropic from "@anthropic-ai/sdk";
import { Contract, type EventLog, JsonRpcProvider } from "ethers";
import HemaTraceabilityArtifact from "@/contracts/HemaTraceability.json";
import { getContractAddress } from "@/config/contracts";
import { DEFAULT_CHAIN, DEFAULT_CHAIN_ID } from "@/config/chains";

/**
 * Server-side tool surface for the "Ask HemaChain" agent.
 *
 * These mirror the read-only MCP tools (`mcp-server/src/index.js`) but run
 * in-process against an ethers `JsonRpcProvider`, so the `/api/ask` route is
 * self-contained and never shells out. Every tool is read-only and returns a
 * compact, language-neutral text summary that the model rephrases for the user.
 */

const UNIT_STATUS = [
  "None",
  "Collected",
  "UnderTest",
  "Quarantined",
  "Released",
  "Processed",
  "Recalled",
] as const;

const COMPONENT_STATUS = [
  "None",
  "Produced",
  "InStorage",
  "Reserved",
  "Transfused",
  "Recalled",
] as const;

const COMPONENT_TYPE = ["Unknown", "RBC", "FFP", "PLT", "CRYO"] as const;

// Statuses where a component is still in inventory and can expire.
const LIVE_STATUSES = new Set(["Produced", "InStorage", "Reserved"]);

let cached: Contract | null = null;

function traceability(): Contract {
  if (cached) return cached;
  const address = getContractAddress("HemaTraceability", DEFAULT_CHAIN_ID);
  if (!address) {
    throw new Error(
      `No HemaTraceability address configured for chain ${DEFAULT_CHAIN_ID}`,
    );
  }
  const rpc = process.env.ASK_RPC_URL ?? DEFAULT_CHAIN.rpcUrl;
  cached = new Contract(
    address,
    HemaTraceabilityArtifact.abi,
    new JsonRpcProvider(rpc),
  );
  return cached;
}

function shortHash(value: unknown): string {
  const s = String(value);
  return s.length > 18 ? `${s.slice(0, 10)}…${s.slice(-6)}` : s;
}

function parseId(raw: string): { isComponent: boolean; n: bigint } {
  const m = raw.trim().match(/^([uc]?)(\d+)$/i);
  if (!m) throw new Error(`Invalid id "${raw}". Use u<n>, c<n>, or a number.`);
  return { isComponent: m[1].toLowerCase() === "c", n: BigInt(m[2]) };
}

async function describeUnit(unitId: bigint): Promise<string> {
  const tc = traceability();
  const u = await tc.getUnit(unitId);
  if (u[0] === 0n) return `Unit #${unitId} not found.`;
  const lines = [
    `# Unit #${u[0]}`,
    `- Status: ${UNIT_STATUS[Number(u[7])] ?? "?"}`,
    `- Volume: ${u[3]} ml`,
    `- Donor hash: ${shortHash(u[1])}`,
    `- Collection center: ${shortHash(u[5])}`,
  ];
  try {
    const tr = await tc.getTestResult(unitId);
    if (tr[2] > 0n) {
      const markers = ["hiv", "hbv", "hcv", "syphilis", "htlv", "chagas"];
      const reactive = markers.filter((_, i) => tr[3 + i]);
      lines.push(
        `- Screening: ${reactive.length ? `reactive for ${reactive.join(", ")}` : "all non-reactive"}`,
      );
    }
  } catch {
    /* no screening recorded yet */
  }
  const childIds = (await tc.getComponentsByUnit(unitId)) as bigint[];
  if (childIds.length) {
    lines.push(`\n## Components (${childIds.length})`);
    for (const cid of childIds) {
      const c = await tc.getComponent(cid);
      lines.push(
        `- #${c[0]} ${COMPONENT_TYPE[Number(c[2])] ?? "?"} · ${c[3]} ml · ${COMPONENT_STATUS[Number(c[6])] ?? "?"}`,
      );
    }
  }
  return lines.join("\n");
}

async function describeComponent(componentId: bigint): Promise<string> {
  const tc = traceability();
  const c = await tc.getComponent(componentId);
  if (c[0] === 0n) return `Component #${componentId} not found.`;
  const lines = [
    `# Component #${c[0]}`,
    `- Type: ${COMPONENT_TYPE[Number(c[2])] ?? "?"}`,
    `- Status: ${COMPONENT_STATUS[Number(c[6])] ?? "?"}`,
    `- Volume: ${c[3]} ml`,
    `- Parent unit: #${c[1]}`,
    `- Expires: ${new Date(Number(c[7]) * 1000).toISOString()}`,
  ];
  const custody = (await tc.queryFilter(
    tc.filters.ComponentCustodyTransferred(componentId),
  )) as EventLog[];
  if (custody.length) {
    lines.push(`\n## Cold chain (${custody.length} handoff(s))`);
    for (const ev of custody) {
      lines.push(`- ${ev.args[3]} °C → ${shortHash(ev.args[2])}`);
    }
  }
  return lines.join("\n");
}

async function countExpiring(hours: number, type?: string): Promise<string> {
  const tc = traceability();
  const produced = (await tc.queryFilter(
    tc.filters.ComponentProduced(),
  )) as EventLog[];
  const ids = [...new Set(produced.map((e) => e.args[0] as bigint))];

  const now = Math.floor(Date.now() / 1000);
  const cutoff = now + hours * 3600;
  const wanted = type?.toUpperCase();

  const rows: string[] = [];
  for (const id of ids) {
    const c = await tc.getComponent(id);
    const status = COMPONENT_STATUS[Number(c[6])] ?? "?";
    const ctype = COMPONENT_TYPE[Number(c[2])] ?? "?";
    const exp = Number(c[7]);
    if (!LIVE_STATUSES.has(status)) continue;
    if (wanted && ctype !== wanted) continue;
    if (exp > now && exp <= cutoff) {
      rows.push(
        `- #${c[0]} ${ctype} · ${c[3]} ml · expires ${new Date(exp * 1000).toISOString()}`,
      );
    }
  }
  const label = wanted ? `${wanted} ` : "";
  return rows.length
    ? `${rows.length} ${label}component(s) expire within ${hours}h:\n${rows.join("\n")}`
    : `No ${label}components expire within ${hours}h.`;
}

async function recentEvents(limit: number): Promise<string> {
  const tc = traceability();
  const names = [
    "DonationCollected",
    "TestResultRecorded",
    "UnitReleased",
    "UnitQuarantined",
    "ComponentProduced",
    "ComponentCustodyTransferred",
    "ComponentRecalled",
    "Transfused",
    "AdverseEventReported",
  ];
  const buckets = await Promise.all(
    names.map((name) =>
      tc
        .queryFilter(name)
        .then((logs) => logs.map((l) => ({ name, log: l as EventLog })))
        .catch(() => [] as { name: string; log: EventLog }[]),
    ),
  );
  const rows = buckets
    .flat()
    .sort((a, b) =>
      a.log.blockNumber !== b.log.blockNumber
        ? b.log.blockNumber - a.log.blockNumber
        : b.log.index - a.log.index,
    )
    .slice(0, limit)
    .map(
      (e) =>
        `- #${e.log.blockNumber} ${e.name} ${Array.from(e.log.args)
          .map((v) => shortHash(typeof v === "bigint" ? v.toString() : v))
          .join(", ")}`,
    );
  return rows.length
    ? `## Recent events\n${rows.join("\n")}`
    : "No events recorded yet.";
}

export const HEMA_TOOLS: Anthropic.Tool[] = [
  {
    name: "count_expiring_components",
    description:
      "Count blood components still in inventory (Produced/InStorage/Reserved) " +
      "that expire within a time window. Optionally restrict to one component " +
      "type. Use this for questions like 'how many RBC expire in the next 48h'.",
    input_schema: {
      type: "object",
      properties: {
        hours: {
          type: "number",
          description: "Look-ahead window in hours (e.g. 48).",
        },
        componentType: {
          type: "string",
          enum: ["RBC", "FFP", "PLT", "CRYO"],
          description:
            "Optional filter. RBC = glóbulos rojos/GR, FFP = plasma/PFC, " +
            "PLT = plaquetas, CRYO = crioprecipitado.",
        },
      },
      required: ["hours"],
    },
  },
  {
    name: "trace_lineage",
    description:
      "Return the full lineage of a donation unit or a component: status, " +
      "volume, screening, child components, and cold-chain handoffs. " +
      "Use 'u<n>' or a bare number for a unit, 'c<n>' for a component.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "e.g. u3, c5, or 3" },
      },
      required: ["id"],
    },
  },
  {
    name: "recent_events",
    description:
      "List the most recent on-chain HemaTraceability events (donations, " +
      "tests, custody transfers, recalls, transfusions, adverse events).",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of events to return (1-100, default 20).",
        },
      },
      required: [],
    },
  },
];

/**
 * Executes a tool by name. Throws on unknown tool; returns a text summary
 * the model feeds back into the conversation as a tool_result.
 */
export async function runHemaTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case "count_expiring_components": {
      const hours = Number(input.hours);
      if (!Number.isFinite(hours) || hours <= 0) {
        throw new Error("`hours` must be a positive number");
      }
      const type =
        typeof input.componentType === "string"
          ? input.componentType
          : undefined;
      return countExpiring(hours, type);
    }
    case "trace_lineage": {
      const { isComponent, n } = parseId(String(input.id ?? ""));
      return isComponent ? describeComponent(n) : describeUnit(n);
    }
    case "recent_events": {
      const raw = Number(input.limit ?? 20);
      const limit = Math.min(100, Math.max(1, Number.isFinite(raw) ? raw : 20));
      return recentEvents(limit);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
