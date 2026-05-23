"use client";

import type { Contract, EventLog } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useContract } from "@/hooks/useContract";
import { type UnitStatusKey, unitStatusOf } from "@/lib/isbt";

export interface UnitView {
  id: bigint;
  donorIdHash: string;
  volumeMl: number;
  aboRhCode: string;
  collectionCenter: string;
  custodian: string;
  collectedAt: bigint;
  status: UnitStatusKey;
}

interface UseDonationsOptions {
  /** Filter by collectionCenter (lowercased address); undefined = all. */
  collectionCenter?: string;
  /** Filter by current status; undefined = all. */
  statuses?: UnitStatusKey[];
}

async function loadUnits(
  registry: Contract,
  opts: UseDonationsOptions,
): Promise<UnitView[]> {
  const events = (await registry.queryFilter(
    registry.filters.DonationCollected(),
  )) as EventLog[];

  const ids = new Set<bigint>();
  for (const ev of events) {
    if (
      opts.collectionCenter &&
      (ev.args[2] as string).toLowerCase() !==
        opts.collectionCenter.toLowerCase()
    ) {
      continue;
    }
    ids.add(ev.args[0] as bigint);
  }

  const units = await Promise.all(
    Array.from(ids).map(async (id) => {
      const raw = (await registry.getUnit(id)) as readonly [
        bigint,
        string,
        bigint,
        bigint,
        string,
        string,
        string,
        bigint,
      ];
      const status = unitStatusOf(raw[7]);
      const view: UnitView = {
        id: raw[0],
        donorIdHash: raw[1],
        collectedAt: raw[2],
        volumeMl: Number(raw[3]),
        aboRhCode: raw[4],
        collectionCenter: raw[5],
        custodian: raw[6],
        status,
      };
      return view;
    }),
  );

  const filtered = opts.statuses
    ? units.filter((u) => opts.statuses!.includes(u.status))
    : units;

  return filtered.sort((a, b) => Number(b.id - a.id));
}

export function useDonations(opts: UseDonationsOptions = {}) {
  const traceability = useContract("HemaTraceability");
  const [units, setUnits] = useState<UnitView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable string key for the filter so the effect re-runs only on real change.
  const cc = opts.collectionCenter?.toLowerCase() ?? "";
  const statusKey = (opts.statuses ?? []).join(",");

  const refresh = useCallback(async () => {
    if (!traceability) {
      setUnits([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const next = await loadUnits(traceability, {
        collectionCenter: cc || undefined,
        statuses: statusKey
          ? (statusKey.split(",") as UnitStatusKey[])
          : undefined,
      });
      setUnits(next);
    } catch (err) {
      setError((err as Error).message);
      setUnits([]);
    } finally {
      setIsLoading(false);
    }
  }, [traceability, cc, statusKey]);

  useEffect(() => {
    if (!traceability) return;
    let cancelled = false;
    void (async () => {
      try {
        const next = await loadUnits(traceability, {
          collectionCenter: cc || undefined,
          statuses: statusKey
            ? (statusKey.split(",") as UnitStatusKey[])
            : undefined,
        });
        if (cancelled) return;
        setUnits(next);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message);
        setUnits([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [traceability, cc, statusKey]);

  return { units, isLoading, error, refresh };
}
