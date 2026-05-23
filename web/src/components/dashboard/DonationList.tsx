"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useDonations, type UnitView } from "@/hooks/useDonations";
import { useWallet } from "@/hooks/useWallet";
import { bytes8ToAboRh, type UnitStatusKey } from "@/lib/isbt";
import { shortAddress } from "@/lib/eth";

const STATUS_TONE: Record<UnitStatusKey, "neutral" | "ok" | "warn" | "critical" | "info" | "primary"> = {
  None: "neutral",
  Collected: "info",
  UnderTest: "primary",
  Quarantined: "warn",
  Released: "ok",
  Processed: "primary",
  Recalled: "critical",
};

interface Props {
  /** Filter by collectionCenter; if omitted, uses connected account. */
  collectionCenter?: string;
}

export function DonationList({ collectionCenter }: Props) {
  const t = useTranslations("bancoSangre.list");
  const tStatus = useTranslations("unitStatus");
  const locale = useLocale();
  const { account } = useWallet();
  const filter = collectionCenter ?? account ?? undefined;
  const { units, isLoading, refresh } = useDonations({
    collectionCenter: filter,
  });

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            aria-label={t("refresh")}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </button>
        </div>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>

      {units.length === 0 ? (
        <p className="text-sm text-[var(--color-fg-muted)]">
          {isLoading ? t("loading") : t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {units.map((u) => (
            <UnitRow
              key={u.id.toString()}
              unit={u}
              tStatus={tStatus}
              locale={locale}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function UnitRow({
  unit,
  tStatus,
  locale,
}: {
  unit: UnitView;
  tStatus: (key: string) => string;
  locale: string;
}) {
  return (
    <li>
      <Link
        href={`/${locale}/units/${unit.id.toString()}`}
        className="rounded-2xl border border-[var(--color-border)] p-3 flex flex-wrap items-center justify-between gap-2 text-sm hover:border-[var(--color-border-strong)]"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-[var(--color-fg-muted)]">
            #{unit.id.toString()}
          </span>
          <Badge tone={STATUS_TONE[unit.status]}>{tStatus(unit.status)}</Badge>
          <span className="font-mono">{bytes8ToAboRh(unit.aboRhCode)}</span>
          <span className="text-[var(--color-fg-muted)]">{unit.volumeMl} ml</span>
        </div>
        <span className="font-mono text-xs text-[var(--color-fg-subtle)]">
          donor {shortAddress(unit.donorIdHash, 8, 6)}
        </span>
      </Link>
    </li>
  );
}
