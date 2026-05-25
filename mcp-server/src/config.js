import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const SC_DIR = join(here, "..", "..", "sc");
const contractsDir = join(here, "..", "..", "web", "src", "contracts");

function abiOf(name) {
  return JSON.parse(readFileSync(join(contractsDir, `${name}.json`), "utf8"))
    .abi;
}

export const RPC_URL = process.env.MCP_RPC_URL ?? "http://127.0.0.1:8545";

export const TRACEABILITY_ADDRESS =
  process.env.MCP_TRACEABILITY_ADDRESS ??
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const TRACEABILITY_ABI = abiOf("HemaTraceability");

export const UNIT_STATUS = [
  "None",
  "Collected",
  "UnderTest",
  "Quarantined",
  "Released",
  "Processed",
  "Recalled",
];
export const COMPONENT_STATUS = [
  "None",
  "Produced",
  "InStorage",
  "Reserved",
  "Transfused",
  "Recalled",
];
export const COMPONENT_TYPE = ["Unknown", "RBC", "FFP", "PLT", "CRYO"];
