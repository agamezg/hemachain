"use client";

import type { EventLog } from "ethers";
import { useEffect, useState } from "react";
import { useContract } from "@/hooks/useContract";
import {
  componentTypeById,
  type UnitStatusKey,
  unitStatusOf,
} from "@/lib/isbt";

export interface UnitDetail {
  id: bigint;
  donorIdHash: string;
  collectedAt: bigint;
  volumeMl: number;
  aboRhCode: string;
  collectionCenter: string;
  custodian: string;
  status: UnitStatusKey;
  testResult: {
    recorded: boolean;
    lab: string;
    performedAt: bigint;
    hiv: boolean;
    hbv: boolean;
    hcv: boolean;
    syphilis: boolean;
    htlv: boolean;
    chagas: boolean;
  } | null;
  children: Array<{
    id: bigint;
    componentKey: string;
    volumeMl: number;
    status: number;
  }>;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  name: string;
  blockNumber: number;
  txHash: string;
  logIndex: number;
  args: readonly unknown[];
}

const UNIT_EVENT_NAMES = [
  "DonationCollected",
  "TestResultRecorded",
  "UnitReleased",
  "UnitQuarantined",
  "UnitRecalled",
] as const;

export function useUnitDetail(unitId: bigint | null) {
  const traceability = useContract("HemaTraceability");
  const [data, setData] = useState<UnitDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isLoading = data === null && error === null && unitId !== null;

  useEffect(() => {
    if (!traceability || unitId === null) return;
    let cancelled = false;

    void (async () => {
      try {
        const rawUnit = (await traceability.getUnit(unitId)) as readonly [
          bigint,
          string,
          bigint,
          bigint,
          string,
          string,
          string,
          bigint,
        ];
        if (rawUnit[0] === 0n) {
          if (!cancelled) {
            setData(null);
            setError("not_found");
          }
          return;
        }

        let testResult: UnitDetail["testResult"] = null;
        try {
          const raw = (await traceability.getTestResult(unitId)) as readonly [
            bigint,
            string,
            bigint,
            boolean,
            boolean,
            boolean,
            boolean,
            boolean,
            boolean,
            string,
            bigint,
          ];
          if (raw[2] > 0n) {
            testResult = {
              recorded: true,
              lab: raw[1],
              performedAt: raw[2],
              hiv: raw[3],
              hbv: raw[4],
              hcv: raw[5],
              syphilis: raw[6],
              htlv: raw[7],
              chagas: raw[8],
            };
          }
        } catch {
          // no test recorded yet
        }

        const childIds = (await traceability.getComponentsByUnit(
          unitId,
        )) as bigint[];
        const children = await Promise.all(
          childIds.map(async (cid) => {
            const c = (await traceability.getComponent(cid)) as readonly [
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
            return {
              id: c[0],
              componentKey:
                componentTypeById(Number(c[2]))?.key ?? "?",
              volumeMl: Number(c[3]),
              status: Number(c[6]),
            };
          }),
        );

        const eventBuckets = await Promise.all(
          UNIT_EVENT_NAMES.map(async (name) => {
            const logs = (await traceability.queryFilter(
              traceability.filters[name](unitId),
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
        setData({
          id: rawUnit[0],
          donorIdHash: rawUnit[1],
          collectedAt: rawUnit[2],
          volumeMl: Number(rawUnit[3]),
          aboRhCode: rawUnit[4],
          collectionCenter: rawUnit[5],
          custodian: rawUnit[6],
          status: unitStatusOf(rawUnit[7]),
          testResult,
          children,
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
  }, [traceability, unitId]);

  return { data, isLoading, error };
}
