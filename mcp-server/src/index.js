import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Contract, JsonRpcProvider } from "ethers";
import { execa } from "execa";
import { z } from "zod";
import {
  COMPONENT_STATUS,
  COMPONENT_TYPE,
  RPC_URL,
  SC_DIR,
  TRACEABILITY_ABI,
  TRACEABILITY_ADDRESS,
  UNIT_STATUS,
} from "./config.js";

const provider = new JsonRpcProvider(RPC_URL);
const traceability = new Contract(
  TRACEABILITY_ADDRESS,
  TRACEABILITY_ABI,
  provider,
);

const text = (s) => ({ content: [{ type: "text", text: s }] });
const errorText = (s) => ({ content: [{ type: "text", text: s }], isError: true });

const server = new McpServer({ name: "hemachain", version: "0.1.0" });

// ── forge_test ────────────────────────────────────────────────────────────
server.registerTool(
  "forge_test",
  {
    title: "Run forge test",
    description:
      "Runs the Foundry test suite in sc/. Optionally filter by test name or contract.",
    inputSchema: {
      matchTest: z.string().optional(),
      matchContract: z.string().optional(),
    },
  },
  async ({ matchTest, matchContract }) => {
    const args = ["test"];
    if (matchTest) args.push("--match-test", matchTest);
    if (matchContract) args.push("--match-contract", matchContract);
    const { stdout, stderr, exitCode } = await execa("forge", args, {
      cwd: SC_DIR,
      reject: false,
    });
    const out = (stdout || stderr || "").slice(-6000);
    return exitCode === 0 ? text(out) : errorText(out);
  },
);

// ── cast_call ─────────────────────────────────────────────────────────────
server.registerTool(
  "cast_call",
  {
    title: "cast call (read-only)",
    description:
      "Performs a read-only eth_call via `cast call`. Example sig: 'getUnit(uint256)'.",
    inputSchema: {
      to: z.string().describe("Contract address (0x…)"),
      sig: z.string().describe("Function signature, e.g. balanceOf(address)"),
      args: z.array(z.string()).optional(),
    },
  },
  async ({ to, sig, args = [] }) => {
    const { stdout, stderr, exitCode } = await execa(
      "cast",
      ["call", to, sig, ...args, "--rpc-url", RPC_URL],
      { reject: false },
    );
    return exitCode === 0 ? text(stdout.trim()) : errorText(stderr || stdout);
  },
);

// ── trace_query ─────────────────────────────────────────────────────────────
server.registerTool(
  "trace_query",
  {
    title: "Trace a unit or component",
    description:
      "Returns a Markdown lineage summary for a donation unit or a component. " +
      "Use 'u<n>' (or a bare number) for a unit, 'c<n>' for a component.",
    inputSchema: { id: z.string().describe("e.g. u3, c5, or 3") },
  },
  async ({ id }) => {
    const m = id.trim().match(/^([uc]?)(\d+)$/i);
    if (!m) return errorText(`Invalid id "${id}". Use u<n>, c<n>, or a number.`);
    const isComponent = m[1].toLowerCase() === "c";
    const n = BigInt(m[2]);
    try {
      return text(
        isComponent ? await describeComponent(n) : await describeUnit(n),
      );
    } catch (err) {
      return errorText(`trace_query failed: ${err.message}`);
    }
  },
);

// ── recent_events ───────────────────────────────────────────────────────────
server.registerTool(
  "recent_events",
  {
    title: "Recent traceability events",
    description:
      "Lists the most recent HemaTraceability events on-chain as Markdown.",
    inputSchema: { limit: z.number().int().min(1).max(100).optional() },
  },
  async ({ limit = 20 }) => {
    try {
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
          traceability
            .queryFilter(name, 0, "latest")
            .then((logs) => logs.map((l) => ({ name, log: l })))
            .catch(() => []),
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
        .map((e) => `- \`#${e.log.blockNumber}\` **${e.name}** ${fmtArgs(e.log.args)}`);
      return text(
        rows.length ? `## Recent events\n${rows.join("\n")}` : "No events yet.",
      );
    } catch (err) {
      return errorText(`recent_events failed: ${err.message}`);
    }
  },
);

function fmtArgs(args) {
  return Array.from(args)
    .map((v) => (typeof v === "bigint" ? v.toString() : String(v)))
    .map((s) => (s.length > 18 ? `${s.slice(0, 10)}…${s.slice(-6)}` : s))
    .join(", ");
}

async function describeUnit(unitId) {
  const u = await traceability.getUnit(unitId);
  if (u[0] === 0n) return `Unit #${unitId} not found.`;
  const lines = [
    `# Unit #${u[0]}`,
    `- Status: **${UNIT_STATUS[Number(u[7])] ?? "?"}**`,
    `- Volume: ${u[3]} ml`,
    `- Donor hash: \`${u[1]}\``,
    `- Collection center: \`${u[5]}\``,
  ];
  try {
    const tr = await traceability.getTestResult(unitId);
    if (tr[2] > 0n) {
      const markers = ["hiv", "hbv", "hcv", "syphilis", "htlv", "chagas"];
      const reactive = markers.filter((_, i) => tr[3 + i]);
      lines.push(
        `- Screening: ${reactive.length ? `reactive for ${reactive.join(", ")}` : "all non-reactive"}`,
      );
    }
  } catch {
    /* no screening yet */
  }
  const childIds = await traceability.getComponentsByUnit(unitId);
  if (childIds.length) {
    lines.push(`\n## Components (${childIds.length})`);
    for (const cid of childIds) {
      const c = await traceability.getComponent(cid);
      lines.push(
        `- #${c[0]} ${COMPONENT_TYPE[Number(c[2])] ?? "?"} · ${c[3]} ml · **${COMPONENT_STATUS[Number(c[6])] ?? "?"}**`,
      );
    }
  }
  return lines.join("\n");
}

async function describeComponent(componentId) {
  const c = await traceability.getComponent(componentId);
  if (c[0] === 0n) return `Component #${componentId} not found.`;
  const lines = [
    `# Component #${c[0]}`,
    `- Type: ${COMPONENT_TYPE[Number(c[2])] ?? "?"}`,
    `- Status: **${COMPONENT_STATUS[Number(c[6])] ?? "?"}**`,
    `- Volume: ${c[3]} ml`,
    `- Parent unit: #${c[1]}`,
    `- Expires: ${new Date(Number(c[7]) * 1000).toISOString()}`,
  ];
  const custody = await traceability.queryFilter(
    traceability.filters.ComponentCustodyTransferred(componentId),
    0,
    "latest",
  );
  if (custody.length) {
    lines.push(`\n## Cold chain (${custody.length} handoff(s))`);
    for (const ev of custody) {
      lines.push(`- ${ev.args[3]} °C → \`${String(ev.args[2]).slice(0, 10)}…\``);
    }
  }
  return lines.join("\n");
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[mcp] hemachain MCP server ready on stdio");
