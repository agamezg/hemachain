"use client";

import type { EventLog } from "ethers";
import { useEffect, useState } from "react";
import { useContract } from "@/hooks/useContract";
import {
  componentStatusOf,
  componentTypeById,
  type ComponentStatusKey,
} from "@/lib/isbt";
import type { TimelineEvent } from "@/hooks/useUnitDetail";

export interface ComponentDetail {
  id: bigint;
  parentUnitId: bigint;
  componentKey: string;
  componentTypeId: number;
  volumeMl: number;
  producedAt: bigint;
  expiresAt: bigint;
  processor: string;
  custodian: string;
  status: ComponentStatusKey;
  events: TimelineEvent[];
}

const COMPONENT_EVENT_NAMES = [
  "ComponentProduced",
  "ComponentCustodyTransferred",
  "ComponentCrossMatched",
  "ComponentRecalled",
  "Transfused",
] as const;

export function useComponentDetail(componentId: bigint | null) {
  const traceability = useContract("HemaTraceability");
  const [data, setData] = useState<ComponentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLoading = data === null && error === null && componentId !== null;

  useEffect(() => {
    if (!traceability || componentId === null) return;
    let cancelled = false;

    void (async () => {
      try {
        const raw = (await traceability.getComponent(componentId)) as readonly [
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
          string,
          bigint,
          bigint,
          string,
        ];
        if (raw[0] === 0n) {
          if (!cancelled) {
            setData(null);
            setError("not_found");
          }
          return;
        }

        const eventBuckets = await Promise.all(
          COMPONENT_EVENT_NAMES.map(async (name) => {
            const logs = (await traceability.queryFilter(
              traceability.filters[name](componentId),
            )) as EventLog[];
            return logs.map<TimelineEvent>((ev) => ({
              name,
              blockNumber: ev.blockNumber,
              txHash: ev.transactionHash,
              logIndex: ev.index,
              args: ev.args as readonly unknown[],
            }));
          }),
        );

        const events = eventBuckets
          .flat()
          .sort((a, b) =>
            a.blockNumber !== b.blockNumber
              ? a.blockNumber - b.blockNumber
              : a.logIndex - b.logIndex,
          );

        if (cancelled) return;
        const ctypeId = Number(raw[2]);
        setData({
          id: raw[0],
          parentUnitId: raw[1],
          componentTypeId: ctypeId,
          componentKey: componentTypeById(ctypeId)?.key ?? "?",
          volumeMl: Number(raw[3]),
          producedAt: raw[4],
          processor: raw[5],
          status: componentStatusOf(raw[6]),
          expiresAt: raw[7],
          custodian: raw[8],
          events,
        });
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setData(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [traceability, componentId]);

  return { data, isLoading, error };
}
