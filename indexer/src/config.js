import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// ABIs are emitted by Foundry and committed into the web app; reuse them so the
// indexer never drifts from what the frontend decodes.
const contractsDir = join(here, "..", "..", "web", "src", "contracts");

function abiOf(name) {
  const artifact = JSON.parse(
    readFileSync(join(contractsDir, `${name}.json`), "utf8"),
  );
  return artifact.abi;
}

export const RPC_WS = process.env.INDEXER_RPC_WS ?? "ws://127.0.0.1:8545";
export const PORT = Number(process.env.INDEXER_PORT ?? 4000);

// Deterministic Anvil addresses from Deploy.s.sol (account 0, nonces 0/1/2) —
// the same values web/src/config/contracts.ts falls back to. Override per env.
export const CONTRACTS = [
  {
    name: "HemaTraceability",
    address:
      process.env.INDEXER_TRACEABILITY_ADDRESS ??
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    abi: abiOf("HemaTraceability"),
    events: [
      "DonationCollected",
      "TestResultRecorded",
      "UnitReleased",
      "UnitQuarantined",
      "UnitRecalled",
      "ComponentProduced",
      "ComponentCustodyTransferred",
      "ComponentCrossMatched",
      "ComponentRecalled",
      "Transfused",
      "AdverseEventReported",
      "LookBackTriggered",
    ],
  },
  {
    name: "HemaCertificate",
    address:
      process.env.INDEXER_CERTIFICATE_ADDRESS ??
      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    abi: abiOf("HemaCertificate"),
    events: ["CertificateIssued", "CertificateRevoked"],
  },
  {
    name: "HemaRegistry",
    address:
      process.env.INDEXER_REGISTRY_ADDRESS ??
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    abi: abiOf("HemaRegistry"),
    events: [
      "RoleRequested",
      "RoleApproved",
      "RoleRejected",
      "RoleRevoked",
      "ActorRegistered",
    ],
  },
];

// Toast tone the dashboard should use per event. Synthetic ExpiryWarning is
// raised by the alert daemon, not the chain.
const SEVERITY = {
  UnitRecalled: "critical",
  ComponentRecalled: "critical",
  AdverseEventReported: "critical",
  LookBackTriggered: "critical",
  CertificateRevoked: "critical",
  UnitQuarantined: "warn",
  ExpiryWarning: "warn",
  UnitReleased: "ok",
  Transfused: "ok",
  CertificateIssued: "ok",
};

export function severityOf(name) {
  return SEVERITY[name] ?? "info";
}
