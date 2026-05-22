import HemaRegistryArtifact from "@/contracts/HemaRegistry.json";
import HemaTraceabilityArtifact from "@/contracts/HemaTraceability.json";
import HemaCertificateArtifact from "@/contracts/HemaCertificate.json";
import type { InterfaceAbi } from "ethers";
import { ANVIL, SEPOLIA } from "./chains";

export type ContractName =
  | "HemaRegistry"
  | "HemaTraceability"
  | "HemaCertificate";

export interface ContractDefinition {
  name: ContractName;
  abi: InterfaceAbi;
  addressByChain: Record<number, `0x${string}` | undefined>;
}

const ANVIL_DEPLOYER_NONCE_0 = "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const;
const ANVIL_DEPLOYER_NONCE_1 = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as const;
const ANVIL_DEPLOYER_NONCE_2 = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" as const;

function envAddr(key: string): `0x${string}` | undefined {
  const v = process.env[key];
  return v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as `0x${string}`) : undefined;
}

export const CONTRACTS: Record<ContractName, ContractDefinition> = {
  HemaRegistry: {
    name: "HemaRegistry",
    abi: HemaRegistryArtifact.abi as InterfaceAbi,
    addressByChain: {
      [ANVIL.id]:
        envAddr("NEXT_PUBLIC_REGISTRY_ADDRESS") ?? ANVIL_DEPLOYER_NONCE_0,
      [SEPOLIA.id]: envAddr("NEXT_PUBLIC_REGISTRY_ADDRESS_SEPOLIA"),
    },
  },
  HemaTraceability: {
    name: "HemaTraceability",
    abi: HemaTraceabilityArtifact.abi as InterfaceAbi,
    addressByChain: {
      [ANVIL.id]:
        envAddr("NEXT_PUBLIC_TRACEABILITY_ADDRESS") ?? ANVIL_DEPLOYER_NONCE_1,
      [SEPOLIA.id]: envAddr("NEXT_PUBLIC_TRACEABILITY_ADDRESS_SEPOLIA"),
    },
  },
  HemaCertificate: {
    name: "HemaCertificate",
    abi: HemaCertificateArtifact.abi as InterfaceAbi,
    addressByChain: {
      [ANVIL.id]:
        envAddr("NEXT_PUBLIC_CERTIFICATE_ADDRESS") ?? ANVIL_DEPLOYER_NONCE_2,
      [SEPOLIA.id]: envAddr("NEXT_PUBLIC_CERTIFICATE_ADDRESS_SEPOLIA"),
    },
  },
};

export function getContractAddress(
  name: ContractName,
  chainId: number,
): `0x${string}` | undefined {
  return CONTRACTS[name].addressByChain[chainId];
}
