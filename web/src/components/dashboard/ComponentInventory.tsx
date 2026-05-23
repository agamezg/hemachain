"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import {
  useComponents,
  type ComponentView,
} from "@/hooks/useComponents";
import { useWallet } from "@/hooks/useWallet";
import { COMPONENT_TYPES, type ComponentStatusKey } from "@/lib/isbt";
import { shortAddress } from "@/lib/eth";

const TONE: Record<ComponentStatusKey, "neutral" | "ok" | "warn" | "critical" | "info" | "primary"> = {
  None: "neutral",
  Produced: "info",
  InStorage: "ok",
  Reserved: "primary",
  Transfused: "neutral",
  Recalled: "critical",
};

interface Props {
  /** Filter by current custodian; if omitted, uses connected account. */
  custodian?: string;
  statuses?: ComponentStatusKey[];
  /** Optional row-level action renderer. */
  renderActions?: (c: ComponentView) => React.ReactNode;
  title: string;
  subtitle: string;
}

export function ComponentInventory({
  custodian,
  statuses,
  renderActions,
  title,
  subtitle,
}: Props) {
  const t = useTranslations("inventory");
  const tStatus = useTranslations("componentStatus");
  const { account } = useWallet();
  const filter = custodian ?? account ?? undefined;
  const { components, isLoading, refresh } = useComponents({
    custodian: filter,
    statuses,
  });
  const [now, setNow] = useState(() => Date.now());

  async function refreshAll() {
    setNow(Date.now());
    await refresh();
  }

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </button>
        </div>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>

      {components.length === 0 ? (
        <p className="text-sm text-[var(--color-fg-muted)]">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> {t("loading")}
            </span>
          ) : (
            t("empty")
          )}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {components.map((c) => {
            const def = COMPONENT_TYPES.find((d) => d.key === c.componentKey);
            const expiryMs = Number(c.expiresAt) * 1000;
            const expiry = new Date(expiryMs);
            const expired = now > expiryMs;
            return (
              <li
                key={c.id.toString()}
                className="rounded-2xl border border-[var(--color-border)] p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 flex-wrap text-sm">
                  <span className="font-mono text-[var(--color-fg-muted)]">
                    #{c.id.toString()}
                  </span>
                  <Badge tone={TONE[c.status]}>{tStatus(c.status)}</Badge>
                  <span className="font-mono">{c.componentKey}</span>
                  <span className="text-[var(--color-fg-muted)]">
                    {c.volumeMl} ml
                  </span>
                  {def ? (
                    <span className="text-xs text-[var(--color-fg-subtle)]">
                      {def.tempMin}/{def.tempMax}°C · {def.days}d
                    </span>
                  ) : null}
                  <Badge tone={expired ? "critical" : "neutral"}>
                    {expired
                      ? t("expired")
                      : t("expiresOn", { date: expiry.toLocaleDateString() })}
                  </Badge>
                  <span className="font-mono text-xs text-[var(--color-fg-subtle)]">
                    parent #{c.parentUnitId.toString()} · custody{" "}
                    {shortAddress(c.custodian)}
                  </span>
                </div>
                {renderActions ? (
                  <div className="flex gap-2 shrink-0">{renderActions(c)}</div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
