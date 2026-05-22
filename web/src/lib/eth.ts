import type { Eip1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      isMetaMask?: boolean;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        handler: (...args: unknown[]) => void,
      ) => void;
    };
  }
}

export function getInjected() {
  if (typeof window === "undefined") return undefined;
  return window.ethereum;
}

export function shortAddress(addr?: string | null, leading = 6, trailing = 4) {
  if (!addr) return "";
  if (addr.length <= leading + trailing) return addr;
  return `${addr.slice(0, leading)}…${addr.slice(-trailing)}`;
}
