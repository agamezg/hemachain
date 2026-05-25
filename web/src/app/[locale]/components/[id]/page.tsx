"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Spinner } from "@/components/ui/Spinner";
import { TraceabilityTimeline } from "@/components/traceability/TraceabilityTimeline";
import { ColdChainBadge } from "@/components/traceability/ColdChainBadge";
import { useComponentDetail } from "@/hooks/useComponentDetail";
import { COMPONENT_TYPES } from "@/lib/isbt";
import { shortAddress } from "@/lib/eth";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default function ComponentDetailPage({ params }: PageProps) {
  const { locale, id } = use(params);
  const t = useTranslations("componentDetail");
  const tStatus = useTranslations("componentStatus");
  const [now] = useState(() => Date.now());

  const componentId = /^\d+$/.test(id) ? BigInt(id) : null;
  const { data, isLoading, error } = useComponentDetail(componentId);

  if (componentId === null) {
    return (
      <Container className="max-w-4xl py-12 sm:py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t("invalidId")}</CardTitle>
            <CardDescription>{t("invalidIdBody")}</CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  const def = data
    ? COMPONENT_TYPES.find((d) => d.key === data.componentKey)
    : undefined;
  const expiryMs = data ? Number(data.expiresAt) * 1000 : 0;
  const expired = data ? now > expiryMs : false;
  const custodyTemps = data
    ? data.events
        .filter((e) => e.name === "ComponentCustodyTransferred")
        .map((e) => Number(e.args[3]))
    : [];

  return (
    <Container className="max-w-4xl py-12 sm:py-16 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title", { id })}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      {isLoading || !data ? (
        error === "not_found" ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("notFound")}</CardTitle>
              <CardDescription>{t("notFoundBody", { id })}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="flex items-center gap-3">
            <Spinner /> <span>{t("loading")}</span>
          </Card>
        )
      ) : (
        <>
          <Card className="flex flex-col gap-3">
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle>#{data.id.toString()}</CardTitle>
                <Badge tone="primary">{tStatus(data.status)}</Badge>
                <Badge tone="info">{data.componentKey}</Badge>
                <Badge tone={expired ? "critical" : "neutral"}>
                  {expired
                    ? t("expired")
                    : t("expiresOn", {
                        date: new Date(expiryMs).toLocaleDateString(),
                      })}
                </Badge>
              </div>
              <CardDescription>
                {t("summary", {
                  volume: data.volumeMl,
                  parent: data.parentUnitId.toString(),
                })}
              </CardDescription>
            </CardHeader>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <dt className="text-[var(--color-fg-muted)]">{t("parent")}</dt>
              <dd>
                <Link
                  href={`/${locale}/units/${data.parentUnitId.toString()}`}
                  className="font-mono text-[var(--color-primary)] hover:underline"
                >
                  unit #{data.parentUnitId.toString()} →
                </Link>
              </dd>
              <dt className="text-[var(--color-fg-muted)]">{t("processor")}</dt>
              <dd className="font-mono">{shortAddress(data.processor)}</dd>
              <dt className="text-[var(--color-fg-muted)]">{t("custodian")}</dt>
              <dd className="font-mono">{shortAddress(data.custodian)}</dd>
              {def ? (
                <>
                  <dt className="text-[var(--color-fg-muted)]">{t("tempRange")}</dt>
                  <dd className="font-mono">
                    {def.tempMin}..{def.tempMax} °C
                  </dd>
                  <dt className="text-[var(--color-fg-muted)]">{t("shelfLife")}</dt>
                  <dd className="font-mono">{def.days} {t("days")}</dd>
                </>
              ) : null}
            </dl>
            {def ? (
              <div className="rounded-2xl border border-[var(--color-border)] p-3">
                <ColdChainBadge
                  readings={custodyTemps}
                  range={{ min: def.tempMin, max: def.tempMax }}
                />
              </div>
            ) : null}
          </Card>

          <Card className="flex flex-col gap-3">
            <CardHeader>
              <CardTitle>{t("timeline")}</CardTitle>
            </CardHeader>
            <TraceabilityTimeline
              events={data.events}
              emptyLabel={t("timelineEmpty")}
              tempRange={
                def ? { min: def.tempMin, max: def.tempMax } : undefined
              }
            />
          </Card>
        </>
      )}
    </Container>
  );
}
