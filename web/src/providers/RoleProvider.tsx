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
import { ZERO_ROLE, roleKeyFromHash, type RoleKey } from "@/config/roles";

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
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

interface RoleContext extends RoleState {
  refresh: () => Promise<void>;
}

const initial: RoleState = {
  roleKey: "NONE",
  actor: null,
  isAdmin: false,
  isLoading: false,
  error: null,
};

function buildState(
  raw: readonly [string, string, string, string, bigint],
  isAdmin: boolean,
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
    isAdmin,
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
    Promise.all([
      registry.actorOf(account) as Promise<unknown>,
      registry.hasRole(ZERO_ROLE, account) as Promise<boolean>,
    ])
      .then(([raw, isAdmin]) => {
        if (cancelled) return;
        setState(
          buildState(
            raw as readonly [string, string, string, string, bigint],
            isAdmin,
          ),
        );
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setState({
          roleKey: "NONE",
          actor: null,
          isAdmin: false,
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
      const [raw, isAdmin] = await Promise.all([
        registry.actorOf(account) as Promise<
          readonly [string, string, string, string, bigint]
        >,
        registry.hasRole(ZERO_ROLE, account) as Promise<boolean>,
      ]);
      setState(buildState(raw, isAdmin));
    } catch (err) {
      setState({
        roleKey: "NONE",
        actor: null,
        isAdmin: false,
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
