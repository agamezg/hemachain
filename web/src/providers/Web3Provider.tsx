"use client";

import { BrowserProvider, JsonRpcProvider, type JsonRpcSigner } from "ethers";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_CHAIN, getChainById, type ChainConfig } from "@/config/chains";
import { getInjected } from "@/lib/eth";

interface Web3State {
  account: string | null;
  chainId: number | null;
  chain: ChainConfig | null;
  isConnecting: boolean;
  hasInjected: boolean;
  isCorrectChain: boolean;
  error: string | null;
}

interface Web3Context extends Web3State {
  browserProvider: BrowserProvider | null;
  readProvider: JsonRpcProvider;
  signer: JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (target: ChainConfig) => Promise<void>;
}

const STORAGE_KEY = "hemachain.wallet";

const initialState: Web3State = {
  account: null,
  chainId: null,
  chain: null,
  isConnecting: false,
  hasInjected: false,
  isCorrectChain: false,
  error: null,
};

export const Web3ContextObj = createContext<Web3Context | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Web3State>(initialState);
  const browserProviderRef = useRef<BrowserProvider | null>(null);
  const signerRef = useRef<JsonRpcSigner | null>(null);

  const readProvider = useMemo(
    () => new JsonRpcProvider(DEFAULT_CHAIN.rpcUrl, DEFAULT_CHAIN.id),
    [],
  );

  const refresh = useCallback(async (silent = false) => {
    const injected = getInjected();
    if (!injected) {
      setState((s) => ({ ...s, hasInjected: false }));
      return;
    }
    const provider = new BrowserProvider(injected, "any");
    browserProviderRef.current = provider;

    try {
      const accounts = (await injected.request({
        method: "eth_accounts",
      })) as string[];
      const account = accounts[0] ?? null;
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const chain = getChainById(chainId) ?? null;
      const signer = account ? await provider.getSigner() : null;
      signerRef.current = signer;
      setState({
        account,
        chainId,
        chain,
        isConnecting: false,
        hasInjected: true,
        isCorrectChain: chainId === DEFAULT_CHAIN.id,
        error: null,
      });
    } catch (err) {
      if (!silent) {
        setState((s) => ({
          ...s,
          hasInjected: true,
          isConnecting: false,
          error: (err as Error).message,
        }));
      }
    }
  }, []);

  const connect = useCallback(async () => {
    const injected = getInjected();
    if (!injected) {
      setState((s) => ({
        ...s,
        hasInjected: false,
        error: "no-injected",
      }));
      return;
    }
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      await injected.request({ method: "eth_requestAccounts" });
      window.localStorage.setItem(STORAGE_KEY, "connected");
      await refresh();
    } catch (err) {
      setState((s) => ({
        ...s,
        isConnecting: false,
        error: (err as Error).message,
      }));
    }
  }, [refresh]);

  const disconnect = useCallback(() => {
    signerRef.current = null;
    browserProviderRef.current = null;
    window.localStorage.removeItem(STORAGE_KEY);
    setState({
      ...initialState,
      hasInjected: !!getInjected(),
    });
  }, []);

  const switchChain = useCallback(
    async (target: ChainConfig) => {
      const injected = getInjected();
      if (!injected) return;
      try {
        await injected.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: target.hexId }],
        });
      } catch (err) {
        const code = (err as { code?: number }).code;
        if (code === 4902) {
          await injected.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: target.hexId,
                chainName: target.name,
                nativeCurrency: target.nativeCurrency,
                rpcUrls: [target.rpcUrl],
                blockExplorerUrls: target.blockExplorer
                  ? [target.blockExplorer]
                  : undefined,
              },
            ],
          });
        } else {
          throw err;
        }
      }
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    const injected = getInjected();
    if (!injected) {
      setState((s) => ({ ...s, hasInjected: false }));
      return;
    }
    setState((s) => ({ ...s, hasInjected: true }));

    const wasConnected =
      window.localStorage.getItem(STORAGE_KEY) === "connected";
    if (wasConnected) {
      void refresh(true);
    } else {
      void refresh(true);
    }

    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        void refresh(true);
      }
    };
    const onChainChanged = () => {
      void refresh(true);
    };

    injected.on?.("accountsChanged", onAccountsChanged);
    injected.on?.("chainChanged", onChainChanged);

    return () => {
      injected.removeListener?.("accountsChanged", onAccountsChanged);
      injected.removeListener?.("chainChanged", onChainChanged);
    };
  }, [refresh, disconnect]);

  const value = useMemo<Web3Context>(
    () => ({
      ...state,
      browserProvider: browserProviderRef.current,
      readProvider,
      signer: signerRef.current,
      connect,
      disconnect,
      switchChain,
    }),
    [state, readProvider, connect, disconnect, switchChain],
  );

  return (
    <Web3ContextObj.Provider value={value}>{children}</Web3ContextObj.Provider>
  );
}
