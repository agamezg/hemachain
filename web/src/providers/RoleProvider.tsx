"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useContract } from "@/hooks/useContract";
import { useWallet } from "@/hooks/useWallet";
import { roleKeyFromHash, type RoleKey } from "@/config/roles";

export interface Actor {
  addr: string;
  role: string;
  name: string;
  country: string;
  registeredAt: bigint;
}

interface RoleState {
  roleKey: RoleKey | "NONE";
  actor: Actor | null;
  isLoading: boolean;
  error: string | null;
}

interface RoleContext extends RoleState {
  refresh: () => Promise<void>;
}

const initial: RoleState = {
  roleKey: "NONE",
  actor: null,
  isLoading: false,
  error: null,
};

function buildActor(
  raw: readonly [string, string, string, string, bigint],
): RoleState {
  const actor: Actor = {
    addr: raw[0],
    role: raw[1],
    name: raw[2],
    country: raw[3],
    registeredAt: raw[4],
  };
  const registered = actor.registeredAt > 0n;
  return {
    roleKey: registered ? roleKeyFromHash(actor.role) : "NONE",
    actor: registered ? actor : null,
    isLoading: false,
    error: null,
  };
}

export const RoleContextObj = createContext<RoleContext | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { account } = useWallet();
  const registry = useContract("HemaRegistry");
  const [state, setState] = useState<RoleState>(initial);

  const hasContract = registry !== null;
  const [tracked, setTracked] = useState<{
    account: string | null;
    hasContract: boolean;
  }>({ account: null, hasContract });

  if (
    tracked.account !== account ||
    tracked.hasContract !== hasContract
  ) {
    setTracked({ account, hasContract });
    setState(initial);
  }

  useEffect(() => {
    if (!account || !registry) return;
    let cancelled = false;
    registry
      .actorOf(account)
      .then((raw: unknown) => {
        if (cancelled) return;
        setState(buildActor(raw as readonly [string, string, string, string, bigint]));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({
          roleKey: "NONE",
          actor: null,
          isLoading: false,
          error: err.message,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [account, registry]);

  const refresh = useCallback(async () => {
    if (!account || !registry) {
      setState(initial);
      return;
    }
    try {
      const raw = (await registry.actorOf(account)) as readonly [
        string,
        string,
        string,
        string,
        bigint,
      ];
      setState(buildActor(raw));
    } catch (err) {
      setState({
        roleKey: "NONE",
        actor: null,
        isLoading: false,
        error: (err as Error).message,
      });
    }
  }, [account, registry]);

  const value = useMemo<RoleContext>(
    () => ({ ...state, refresh }),
    [state, refresh],
  );

  return (
    <RoleContextObj.Provider value={value}>{children}</RoleContextObj.Provider>
  );
}
