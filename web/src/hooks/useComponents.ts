"use client";

import type { Contract, EventLog } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useContract } from "@/hooks/useContract";
import {
  componentStatusOf,
  componentTypeById,
  type ComponentStatusKey,
} from "@/lib/isbt";

export interface ComponentView {
  id: bigint;
  parentUnitId: bigint;
  componentType: number;
  componentKey: string; // RBC/FFP/PLT/CRYO
  volumeMl: number;
  producedAt: bigint;
  processor: string;
  status: ComponentStatusKey;
  expiresAt: bigint;
  custodian: string;
}

interface UseComponentsOptions {
  /** Filter by current custodian address (lowercased). */
  custodian?: string;
  /** Filter by current status. */
  statuses?: ComponentStatusKey[];
}

async function loadComponents(
  traceability: Contract,
  opts: UseComponentsOptions,
): Promise<ComponentView[]> {
  const events = (await traceability.queryFilter(
    traceability.filters.ComponentProduced(),
  )) as EventLog[];

  const ids = new Set<bigint>();
  for (const ev of events) {
    ids.add(ev.args[0] as bigint);
  }

  const list = await Promise.all(
    Array.from(ids).map(async (id) => {
      const raw = (await traceability.getComponent(id)) as readonly [
        bigint, // id
        bigint, // parentUnitId
        bigint, // componentType (enum, uint8)
        bigint, // volumeMl
        bigint, // producedAt
        string, // processor
        bigint, // status (enum)
        bigint, // expiresAt
        string, // custodian
      ];
      const ctypeId = Number(raw[2]);
      const def = componentTypeById(ctypeId);
      return {
        id: raw[0],
        parentUnitId: raw[1],
        componentType: ctypeId,
        componentKey: def?.key ?? "?",
        volumeMl: Number(raw[3]),
        producedAt: raw[4],
        processor: raw[5],
        status: componentStatusOf(raw[6]),
        expiresAt: raw[7],
        custodian: raw[8],
      } satisfies ComponentView;
    }),
  );

  const filtered = list.filter((c) => {
    if (
      opts.custodian &&
      c.custodian.toLowerCase() !== opts.custodian.toLowerCase()
    ) {
      return false;
    }
    if (opts.statuses && !opts.statuses.includes(c.status)) return false;
    return true;
  });

  return filtered.sort((a, b) => Number(b.id - a.id));
}

export function useComponents(opts: UseComponentsOptions = {}) {
  const traceability = useContract("HemaTraceability");
  const [components, setComponents] = useState<ComponentView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cust = opts.custodian?.toLowerCase() ?? "";
  const statusKey = (opts.statuses ?? []).join(",");

  const refresh = useCallback(async () => {
    if (!traceability) return;
    setIsLoading(true);
    setError(null);
    try {
      const next = await loadComponents(traceability, {
        custodian: cust || undefined,
        statuses: statusKey
          ? (statusKey.split(",") as ComponentStatusKey[])
          : undefined,
      });
      setComponents(next);
    } catch (err) {
      setError((err as Error).message);
      setComponents([]);
    } finally {
      setIsLoading(false);
    }
  }, [traceability, cust, statusKey]);

  useEffect(() => {
    if (!traceability) return;
    let cancelled = false;
    void (async () => {
      try {
        const next = await loadComponents(traceability, {
          custodian: cust || undefined,
          statuses: statusKey
            ? (statusKey.split(",") as ComponentStatusKey[])
            : undefined,
        });
        if (cancelled) return;
        setComponents(next);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
        setComponents([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [traceability, cust, statusKey]);

  return { components, isLoading, error, refresh };
}
