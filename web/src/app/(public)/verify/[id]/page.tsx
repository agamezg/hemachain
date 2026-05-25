"use client";

import { ShieldCheck } from "lucide-react";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Spinner } from "@/components/ui/Spinner";
import { QRVerifyCode } from "@/components/certificates/QRVerifyCode";
import { ColdChainBadge } from "@/components/traceability/ColdChainBadge";
import { ComponentLineageTree } from "@/components/traceability/ComponentLineageTree";
import { TraceabilityTimeline } from "@/components/traceability/TraceabilityTimeline";
import { useComponentDetail } from "@/hooks/useComponentDetail";
import { useUnitDetail } from "@/hooks/useUnitDetail";
import {
  bytes8ToAboRh,
  componentStatusOf,
  componentTypeById,
} from "@/lib/isbt";

interface PageProps {
  params: Promise<{ id: string }>;
}

const MARKERS = ["hiv", "hbv", "hcv", "syphilis", "htlv", "chagas"] as const;

export default function VerifyPage({ params }: PageProps) {
  const { id: rawId } = use(params);
  const t = useTranslations("verify");

  const match = rawId.match(/^([uc]?)(\d+)$/i);
  const isComponent = match ? match[1].toLowerCase() === "c" : false;
  const numId = match ? BigInt(match[2]) : null;

  const componentId = isComponent ? numId : null;
  const { data: comp, error: compError } = useComponentDetail(componentId);

  // For a component we render its parent unit's lineage (siblings + highlight).
  const unitIdForTree = isComponent ? (comp?.parentUnitId ?? null) : numId;
  const { data: unit, error: unitError } = useUnitDetail(unitIdForTree);

  const [origin] = useState(() =>
    typeof window !== "undefined" ? window.location.origin : "",
  );
  const verifyUrl = origin ? `${origin}/verify/${rawId}` : "";

  if (match === null) {
    return (
      <Container className="max-w-3xl py-12 sm:py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t("invalid.title")}</CardTitle>
            <CardDescription>{t("invalid.body")}</CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  const notFound = isComponent
    ? compError === "not_found"
    : unitError === "not_found";
  const primaryReady = isComponent ? comp !== null : unit !== null;

  const compDef = comp ? componentTypeById(comp.componentTypeId) : undefined;
  const custodyTemps = comp
    ? comp.events
        .filter((e) => e.name === "ComponentCustodyTransferred")
        .map((e) => Number(e.args[3]))
    : [];

  return (
    <Container className="max-w-3xl py-12 sm:py-16 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          <ShieldCheck className="h-7 w-7 text-[var(--color-accent-ok)]" />
          {t("header.title")}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)]">
          {t("header.subtitle", { id: rawId })}
        </p>
      </header>

      {notFound ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("notFound.title")}</CardTitle>
            <CardDescription>{t("notFound.body", { id: rawId })}</CardDescription>
          </CardHeader>
        </Card>
      ) : !primaryReady ? (
        <Card className="flex items-center gap-3">
          <Spinner /> <span>{t("loading")}</span>
        </Card>
      ) : (
        <>
          {isComponent && comp ? (
            <Card className="flex flex-col gap-4">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{t("component.title")}</CardTitle>
                  <Badge tone="info">{comp.componentKey}</Badge>
                  <span className="font-mono text-xs text-[var(--color-fg-muted)]">
                    #{comp.id.toString()}
                  </span>
                </div>
                <CardDescription>
                  {t("component.expires", {
                    date: new Date(
                      Number(comp.expiresAt) * 1000,
                    ).toLocaleDateString(),
                  })}
                </CardDescription>
              </CardHeader>
              {compDef ? (
                <ColdChainBadge
                  readings={custodyTemps}
                  range={{ min: compDef.tempMin, max: compDef.tempMax }}
                />
              ) : null}
            </Card>
          ) : null}

          {unit ? (
            <Card className="flex flex-col gap-4">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{t("origin.title")}</CardTitle>
                  <span className="font-mono">{bytes8ToAboRh(unit.aboRhCode)}</span>
                </div>
                <CardDescription>
                  {t("origin.summary", {
                    volume: unit.volumeMl,
                    collected: new Date(
                      Number(unit.collectedAt) * 1000,
                    ).toLocaleDateString(),
                  })}
                </CardDescription>
              </CardHeader>
              {unit.testResult ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-[var(--color-fg)]">
                    {MARKERS.some((m) => unit.testResult![m])
                      ? t("origin.screeningFindings")
                      : t("origin.screeningClear")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {MARKERS.map((m) => (
                      <Badge
                        key={m}
                        tone={unit.testResult![m] ? "critical" : "ok"}
                      >
                        {m.toUpperCase()}
                        {unit.testResult![m] ? "+" : "−"}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {t("origin.noScreening")}
                </p>
              )}
            </Card>
          ) : null}

          {unit ? (
            <Card className="flex flex-col gap-3">
              <CardHeader>
                <CardTitle>{t("lineage.title")}</CardTitle>
                <CardDescription>{t("lineage.subtitle")}</CardDescription>
              </CardHeader>
              <ComponentLineageTree
                root={{
                  id: unit.id,
                  label: bytes8ToAboRh(unit.aboRhCode),
                  volumeMl: unit.volumeMl,
                  status: unit.status,
                }}
                childComponents={unit.children.map((c) => ({
                  id: c.id,
                  componentKey: c.componentKey,
                  volumeMl: c.volumeMl,
                  status: componentStatusOf(c.status),
                }))}
                highlightId={isComponent ? (numId ?? undefined) : undefined}
                unitHref={(uid) => `/verify/u${uid.toString()}`}
                componentHref={(cid) => `/verify/c${cid.toString()}`}
              />
            </Card>
          ) : null}

          <Card className="flex flex-col gap-3">
            <CardHeader>
              <CardTitle>{t("timeline.title")}</CardTitle>
            </CardHeader>
            {isComponent && comp ? (
              <TraceabilityTimeline
                events={comp.events}
                emptyLabel={t("timeline.empty")}
                tempRange={
                  compDef
                    ? { min: compDef.tempMin, max: compDef.tempMax }
                    : undefined
                }
              />
            ) : unit ? (
              <TraceabilityTimeline
                events={unit.events}
                emptyLabel={t("timeline.empty")}
              />
            ) : null}
          </Card>

          {verifyUrl ? (
            <Card className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle>{t("qr.title")}</CardTitle>
                <CardDescription>{t("qr.hint")}</CardDescription>
              </div>
              <QRVerifyCode url={verifyUrl} size={140} />
            </Card>
          ) : null}

          <p className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 text-xs text-[var(--color-fg-muted)]">
            {t("anon")}
          </p>
        </>
      )}
    </Container>
  );
}
