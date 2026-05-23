"use client";

import type { EventLog } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useContract } from "@/hooks/useContract";
import { roleKeyFromHash, type RoleKey } from "@/config/roles";

export interface PendingRoleRequest {
  actor: string;
  role: string;
  roleKey: RoleKey | "NONE";
  name: string;
  country: string;
  blockNumber: number;
  transactionHash: string;
}

type Bucket = Map<string, PendingRoleRequest>;

function keyOf(actor: string, role: string) {
  return `${actor.toLowerCase()}|${role.toLowerCase()}`;
}

function sortChronological(logs: EventLog[]): EventLog[] {
  return logs.slice().sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
    return a.index - b.index;
  });
}

export function useRoleRequests() {
  const registry = useContract("HemaRegistry");
  const [pending, setPending] = useState<PendingRoleRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    if (!registry) {
      setPending([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [requested, approved, rejected] = await Promise.all([
        registry.queryFilter(registry.filters.RoleRequested()) as Promise<
          EventLog[]
        >,
        registry.queryFilter(registry.filters.RoleApproved()) as Promise<
          EventLog[]
        >,
        registry.queryFilter(registry.filters.RoleRejected()) as Promise<
          EventLog[]
        >,
      ]);

      const all = sortChronological([...requested, ...approved, ...rejected]);
      const bucket: Bucket = new Map();
      for (const ev of all) {
        const actor = ev.args[0] as string;
        const role = ev.args[1] as string;
        const k = keyOf(actor, role);
        if (ev.fragment.name === "RoleRequested") {
          bucket.set(k, {
            actor,
            role,
            roleKey: roleKeyFromHash(role),
            name: (ev.args[2] as string) ?? "",
            country: (ev.args[3] as string) ?? "",
            blockNumber: ev.blockNumber,
            transactionHash: ev.transactionHash,
          });
        } else {
          bucket.delete(k);
        }
      }
      setPending(Array.from(bucket.values()).reverse());
    } catch (err) {
      setError((err as Error).message);
      setPending([]);
    } finally {
      setIsLoading(false);
    }
  }, [registry]);

  useEffect(() => {
    if (!registry) return;
    let cancelled = false;
    void (async () => {
      try {
        const [requested, approved, rejected] = await Promise.all([
          registry.queryFilter(registry.filters.RoleRequested()) as Promise<
            EventLog[]
          >,
          registry.queryFilter(registry.filters.RoleApproved()) as Promise<
            EventLog[]
          >,
          registry.queryFilter(registry.filters.RoleRejected()) as Promise<
            EventLog[]
          >,
        ]);
        if (cancelled) return;
        const all = sortChronological([...requested, ...approved, ...rejected]);
        const bucket: Bucket = new Map();
        for (const ev of all) {
          const actor = ev.args[0] as string;
          const role = ev.args[1] as string;
          const k = keyOf(actor, role);
          if (ev.fragment.name === "RoleRequested") {
            bucket.set(k, {
              actor,
              role,
              roleKey: roleKeyFromHash(role),
              name: (ev.args[2] as string) ?? "",
              country: (ev.args[3] as string) ?? "",
              blockNumber: ev.blockNumber,
              transactionHash: ev.transactionHash,
            });
          } else {
            bucket.delete(k);
          }
        }
        if (cancelled) return;
        setPending(Array.from(bucket.values()).reverse());
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
        setPending([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [registry]);

  return { pending, isLoading, error, refresh: fetchPending };
}
