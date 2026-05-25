import { Contract, WebSocketProvider } from "ethers";
import { CONTRACTS, PORT, RPC_WS, severityOf } from "./config.js";
import { insertEvent } from "./db.js";
import { broadcast, startServer } from "./server.js";

// Component lifecycle mirror, rebuilt from events, used only by the expiry
// daemon (the chain has no "list all components" view).
const componentState = new Map(); // id -> { expiresAt: ms, status }
const expiryWarned = new Set();

// Recurses so array args (e.g. LookBackTriggered's uint256[]) and their nested
// bigints survive JSON.stringify.
function toJsonable(v) {
  if (typeof v === "bigint") return v.toString();
  if (Array.isArray(v)) return v.map(toJsonable);
  return v;
}

function serializeArgs(args) {
  return Array.from(args).map(toJsonable);
}

function trackComponent(name, args) {
  const id = String(args[0]);
  switch (name) {
    case "ComponentProduced":
      componentState.set(id, {
        expiresAt: Number(args[4]) * 1000,
        status: "Produced",
      });
      break;
    case "ComponentCustodyTransferred":
      if (componentState.has(id)) componentState.get(id).status = "InStorage";
      break;
    case "ComponentCrossMatched":
      if (componentState.has(id)) componentState.get(id).status = "Reserved";
      break;
    case "Transfused":
      if (componentState.has(id)) componentState.get(id).status = "Transfused";
      break;
    case "ComponentRecalled":
      if (componentState.has(id)) componentState.get(id).status = "Recalled";
      break;
    default:
      break;
  }
}

function record(contractName, name, rawArgs, log, { live }) {
  const args = serializeArgs(rawArgs);
  const rec = {
    contract: contractName,
    name,
    block: log.blockNumber,
    tx: log.transactionHash,
    log_index: log.index,
    severity: severityOf(name),
    args,
  };
  const isNew = insertEvent(rec);
  trackComponent(name, args);
  if (live && isNew) {
    broadcast({ ...rec, logIndex: rec.log_index, ts: Date.now() });
  }
}

// Warn once per component as it crosses into the 48h-to-expiry window, unless
// it has already been transfused or recalled.
function checkExpiry() {
  const now = Date.now();
  for (const [id, s] of componentState) {
    if (s.status === "Transfused" || s.status === "Recalled") continue;
    const hoursLeft = (s.expiresAt - now) / 3_600_000;
    if (hoursLeft > 0 && hoursLeft <= 48 && !expiryWarned.has(id)) {
      expiryWarned.add(id);
      const rec = {
        contract: "HemaTraceability",
        name: "ExpiryWarning",
        block: 0,
        tx: `expiry-${id}`,
        log_index: 0,
        severity: hoursLeft <= 12 ? "critical" : "warn",
        args: [id, String(Math.round(hoursLeft))],
      };
      if (insertEvent(rec)) {
        broadcast({ ...rec, logIndex: 0, ts: now });
      }
    }
  }
}

async function waitForRpc(provider, tries = 20) {
  for (let i = 0; i < tries; i++) {
    try {
      await provider.getBlockNumber();
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function main() {
  startServer(PORT);

  const provider = new WebSocketProvider(RPC_WS);
  const ready = await waitForRpc(provider);
  if (!ready) {
    console.warn(
      `[indexer] RPC ${RPC_WS} unreachable — REST/SSE up, but no chain subscription. Is Anvil running?`,
    );
    return;
  }
  console.log(`[indexer] connected to ${RPC_WS}`);

  for (const c of CONTRACTS) {
    const contract = new Contract(c.address, c.abi, provider);

    // Backfill history so the indexer reflects events that predate it.
    for (const name of c.events) {
      try {
        const logs = await contract.queryFilter(name, 0, "latest");
        for (const ev of logs) record(c.name, name, ev.args, ev, { live: false });
      } catch (err) {
        console.warn(
          `[indexer] backfill ${c.name}.${name} failed: ${err.message}`,
        );
      }
    }

    // Live subscription — ethers passes a ContractEventPayload as the last arg.
    for (const name of c.events) {
      contract.on(name, (...listenerArgs) => {
        const payload = listenerArgs[listenerArgs.length - 1];
        record(c.name, name, payload.args, payload.log, { live: true });
      });
    }
  }

  checkExpiry();
  const expiryTimer = setInterval(checkExpiry, 60_000);

  const shutdown = () => {
    clearInterval(expiryTimer);
    provider.destroy();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log(
    `[indexer] subscribed to ${CONTRACTS.reduce((n, c) => n + c.events.length, 0)} event types across ${CONTRACTS.length} contracts`,
  );
}

main().catch((err) => {
  console.error("[indexer] fatal:", err);
  process.exit(1);
});
