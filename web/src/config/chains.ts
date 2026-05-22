export interface ChainConfig {
  id: number;
  hexId: `0x${string}`;
  name: string;
  shortName: string;
  rpcUrl: string;
  blockExplorer?: string;
  nativeCurrency: { name: string; symbol: string; decimals: 18 };
}

export const ANVIL: ChainConfig = {
  id: 31337,
  hexId: "0x7a69",
  name: "Anvil Local",
  shortName: "Anvil",
  rpcUrl: "http://127.0.0.1:8545",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
};

export const SEPOLIA: ChainConfig = {
  id: 11155111,
  hexId: "0xaa36a7",
  name: "Sepolia",
  shortName: "Sepolia",
  rpcUrl:
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ??
    "https://ethereum-sepolia-rpc.publicnode.com",
  blockExplorer: "https://sepolia.etherscan.io",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
};

export const SUPPORTED_CHAINS: ChainConfig[] = [ANVIL, SEPOLIA];

export function getChainById(id: number | bigint): ChainConfig | undefined {
  const numeric = typeof id === "bigint" ? Number(id) : id;
  return SUPPORTED_CHAINS.find((c) => c.id === numeric);
}

export const DEFAULT_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? ANVIL.id,
);

export const DEFAULT_CHAIN: ChainConfig =
  getChainById(DEFAULT_CHAIN_ID) ?? ANVIL;
