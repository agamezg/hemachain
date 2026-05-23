"use client";

import Link from "next/link";
import { use } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Spinner } from "@/components/ui/Spinner";
import { Timeline } from "@/components/dashboard/Timeline";
import { useUnitDetail } from "@/hooks/useUnitDetail";
import { bytes8ToAboRh } from "@/lib/isbt";
import { shortAddress } from "@/lib/eth";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default function UnitDetailPage({ params }: PageProps) {
  const { locale, id } = use(params);
  const t = useTranslations("unitDetail");
  const tStatus = useTranslations("unitStatus");

  const unitId = /^\d+$/.test(id) ? BigInt(id) : null;
  const { data, isLoading, error } = useUnitDetail(unitId);

  if (unitId === null) {
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
              <div className="flex items-center gap-2">
                <CardTitle>#{data.id.toString()}</CardTitle>
                <Badge tone="primary">{tStatus(data.status)}</Badge>
                <span className="font-mono">{bytes8ToAboRh(data.aboRhCode)}</span>
              </div>
              <CardDescription>
                {t("summary", {
                  volume: data.volumeMl,
                  collected: new Date(Number(data.collectedAt) * 1000).toLocaleString(),
                })}
              </CardDescription>
            </CardHeader>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <dt className="text-[var(--color-fg-muted)]">{t("donorHash")}</dt>
              <dd className="font-mono break-all">{data.donorIdHash}</dd>
              <dt className="text-[var(--color-fg-muted)]">{t("collection")}</dt>
              <dd className="font-mono">{shortAddress(data.collectionCenter)}</dd>
              <dt className="text-[var(--color-fg-muted)]">{t("custodian")}</dt>
              <dd className="font-mono">{shortAddress(data.custodian)}</dd>
            </dl>
            {data.testResult ? (
              <div className="rounded-2xl border border-[var(--color-border)] p-3 flex flex-col gap-2">
                <p className="text-sm font-medium text-[var(--color-fg)]">
                  {t("test.title")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    ["hiv", "hbv", "hcv", "syphilis", "htlv", "chagas"] as const
                  ).map((k) => (
                    <Badge
                      key={k}
                      tone={data.testResult![k] ? "critical" : "ok"}
                    >
                      {k.toUpperCase()}
                      {data.testResult![k] ? "+" : "−"}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  {t("test.byLab", {
                    lab: shortAddress(data.testResult.lab),
                    at: new Date(Number(data.testResult.performedAt) * 1000).toLocaleString(),
                  })}
                </p>
              </div>
            ) : null}
          </Card>

          {data.children.length > 0 ? (
            <Card className="flex flex-col gap-3">
              <CardHeader>
                <CardTitle>{t("children.title")}</CardTitle>
                <CardDescription>
                  {t("children.subtitle", { n: data.children.length })}
                </CardDescription>
              </CardHeader>
              <ul className="flex flex-col gap-2">
                {data.children.map((c) => (
                  <li key={c.id.toString()}>
                    <Link
                      href={`/${locale}/components/${c.id.toString()}`}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--color-border)] p-3 hover:border-[var(--color-border-strong)] text-sm"
                    >
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-[var(--color-fg-muted)]">
                          #{c.id.toString()}
                        </span>
                        <span className="font-mono">{c.componentKey}</span>
                        <span className="text-[var(--color-fg-muted)]">
                          {c.volumeMl} ml
                        </span>
                      </span>
                      <span className="text-xs text-[var(--color-fg-subtle)]">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="flex flex-col gap-3">
            <CardHeader>
              <CardTitle>{t("timeline")}</CardTitle>
            </CardHeader>
            <Timeline events={data.events} emptyLabel={t("timelineEmpty")} />
          </Card>
        </>
      )}
    </Container>
  );
}
