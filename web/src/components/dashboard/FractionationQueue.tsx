"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useContract } from "@/hooks/useContract";
import { useDonations, type UnitView } from "@/hooks/useDonations";
import { useTransaction } from "@/hooks/useTransaction";
import {
  COMPONENT_TYPES,
  bytes8ToAboRh,
  type ComponentTypeKey,
} from "@/lib/isbt";

interface RemainingMap {
  [unitId: string]: number;
}

export function FractionationQueue() {
  const t = useTranslations("fraccionamiento");
  const traceability = useContract("HemaTraceability", { withSigner: true });
  const traceabilityRead = useContract("HemaTraceability");
  const { run, isPending } = useTransaction();

  const { units, isLoading, refresh } = useDonations({
    statuses: ["Released", "Processed"],
  });
  const [remaining, setRemaining] = useState<RemainingMap>({});

  const fetchRemaining = useCallback(async () => {
    if (!traceabilityRead || units.length === 0) {
      setRemaining({});
      return;
    }
    const entries = await Promise.all(
      units.map(async (u) => {
        const value = (await traceabilityRead.splitVolumeOf(u.id)) as bigint;
        return [u.id.toString(), Number(value)] as const;
      }),
    );
    setRemaining(Object.fromEntries(entries));
  }, [traceabilityRead, units]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!traceabilityRead || units.length === 0) {
          if (!cancelled) setRemaining({});
          return;
        }
        const entries = await Promise.all(
          units.map(async (u) => {
            const value = (await traceabilityRead.splitVolumeOf(u.id)) as bigint;
            return [u.id.toString(), Number(value)] as const;
          }),
        );
        if (cancelled) return;
        setRemaining(Object.fromEntries(entries));
      } catch {
        if (!cancelled) setRemaining({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [traceabilityRead, units]);

  async function refreshAll() {
    await refresh();
    await fetchRemaining();
  }

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("queue.title")}</CardTitle>
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {t("queue.refresh")}
          </button>
        </div>
        <CardDescription>{t("queue.subtitle")}</CardDescription>
      </CardHeader>

      {units.length === 0 ? (
        <p className="text-sm text-[var(--color-fg-muted)]">
          {isLoading ? t("queue.loading") : t("queue.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {units.map((u) => (
            <UnitFractionationRow
              key={u.id.toString()}
              unit={u}
              remaining={remaining[u.id.toString()] ?? u.volumeMl}
              disabled={!traceability || isPending}
              onProduce={async (type, volume) => {
                const ok = await run(
                  () => traceability!.produceComponent(u.id, type, volume),
                  {
                    messages: {
                      pending: t("toast.pending"),
                      success: t("toast.success", { id: u.id.toString() }),
                      errorPrefix: t("toast.error"),
                    },
                  },
                );
                if (ok) await refreshAll();
              }}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

interface UnitFractionationRowProps {
  unit: UnitView;
  remaining: number;
  disabled: boolean;
  onProduce: (type: number, volume: number) => Promise<void>;
}

function UnitFractionationRow({
  unit,
  remaining,
  disabled,
  onProduce,
}: UnitFractionationRowProps) {
  const t = useTranslations("fraccionamiento");
  const [typeKey, setTypeKey] = useState<ComponentTypeKey>("RBC");
  const [volume, setVolume] = useState<number>(Math.min(200, remaining));
  const typeDef = COMPONENT_TYPES.find((c) => c.key === typeKey)!;

  const invalid = volume <= 0 || volume > remaining;

  return (
    <li className="rounded-2xl border border-[var(--color-border)] p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-mono text-[var(--color-fg-muted)]">
          #{unit.id.toString()}
        </span>
        <Badge tone={unit.status === "Released" ? "ok" : "primary"}>
          {unit.status}
        </Badge>
        <span className="font-mono">{bytes8ToAboRh(unit.aboRhCode)}</span>
        <span className="text-[var(--color-fg-muted)]">
          {t("queue.totalVolume", { ml: unit.volumeMl })}
        </span>
        <Badge tone={remaining === 0 ? "neutral" : "info"}>
          {t("queue.remaining", { ml: remaining })}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto] gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`type-${unit.id}`}
            className="text-xs font-medium text-[var(--color-fg)]"
          >
            {t("form.type")}
          </label>
          <select
            id={`type-${unit.id}`}
            value={typeKey}
            onChange={(e) => setTypeKey(e.target.value as ComponentTypeKey)}
            className="h-10 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-sm"
          >
            {COMPONENT_TYPES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.key} · {c.days}d · {c.tempMin}/{c.tempMax}°C
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`vol-${unit.id}`}
            className="text-xs font-medium text-[var(--color-fg)]"
          >
            {t("form.volume")}
          </label>
          <input
            id={`vol-${unit.id}`}
            type="number"
            min={1}
            max={remaining}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-10 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-sm font-mono"
          />
        </div>
        <Button
          size="md"
          disabled={disabled || invalid}
          onClick={() => void onProduce(typeDef.id, volume)}
        >
          {t("form.submit")}
        </Button>
      </div>
      {invalid ? (
        <p className="text-xs text-[var(--color-accent-warn)]">
          {volume <= 0 ? t("form.errorMin") : t("form.errorMax")}
        </p>
      ) : null}
    </li>
  );
}
