"use client";

import type { EventLog } from "ethers";
import { useEffect, useState } from "react";
import { useContract } from "@/hooks/useContract";

export interface ChainEvent {
  name: string;
  blockNumber: number;
  txHash: string;
  logIndex: number;
  args: readonly unknown[];
}

const TRACKED = [
  "DonationCollected",
  "TestResultRecorded",
  "UnitReleased",
  "UnitQuarantined",
  "UnitRecalled",
  "ComponentProduced",
  "ComponentCustodyTransferred",
  "ComponentCrossMatched",
  "ComponentRecalled",
  "Transfused",
  "AdverseEventReported",
  "LookBackTriggered",
] as const;

export function useChainEvents(limit = 30) {
  const traceability = useContract("HemaTraceability");
  const [events, setEvents] = useState<ChainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchAll() {
    if (!traceability) return;
    setIsLoading(true);
    try {
      const buckets = await Promise.all(
        TRACKED.map(async (name) => {
          const logs = (await traceability.queryFilter(
            traceability.filters[name](),
          )) as EventLog[];
          return logs.map<ChainEvent>((ev) => ({
            name,
            blockNumber: ev.blockNumber,
            txHash: ev.transactionHash,
            logIndex: ev.index,
            args: ev.args as readonly unknown[],
          }));
        }),
      );
      const flat = buckets
        .flat()
        .sort((a, b) =>
          a.blockNumber !== b.blockNumber
            ? b.blockNumber - a.blockNumber
            : b.logIndex - a.logIndex,
        )
        .slice(0, limit);
      setEvents(flat);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!traceability) return;
    let cancelled = false;
    void (async () => {
      try {
        const buckets = await Promise.all(
          TRACKED.map(async (name) => {
            const logs = (await traceability.queryFilter(
              traceability.filters[name](),
            )) as EventLog[];
            return logs.map<ChainEvent>((ev) => ({
              name,
              blockNumber: ev.blockNumber,
              txHash: ev.transactionHash,
              logIndex: ev.index,
              args: ev.args as readonly unknown[],
            }));
          }),
        );
        if (cancelled) return;
        const flat = buckets
          .flat()
          .sort((a, b) =>
            a.blockNumber !== b.blockNumber
              ? b.blockNumber - a.blockNumber
              : b.logIndex - a.logIndex,
          )
          .slice(0, limit);
        setEvents(flat);
      } catch {
        /* stale data persists harmlessly */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [traceability, limit]);

  return { events, isLoading, refresh: fetchAll };
}
