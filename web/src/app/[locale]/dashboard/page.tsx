"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useRole } from "@/hooks/useRole";
import { useWallet } from "@/hooks/useWallet";
import { shortAddress } from "@/lib/eth";
import type { RoleKey } from "@/config/roles";

const ROLE_LANDING: Partial<Record<RoleKey | "NONE", { path: string } | null>> = {
  BANCO_SANGRE: { path: "/dashboard/banco-sangre" },
  LABORATORIO: { path: "/dashboard/laboratorio" },
  FRACCIONAMIENTO: { path: "/dashboard/fraccionamiento" },
  // Capa B.2 pendientes:
  MEDICINA_TRANSFUSIONAL: null,
  AUDITOR: null,
  CERTIFICADOR: null,
};

export default function DashboardRouter() {
  const t = useTranslations("dashboard");
  const tRole = useTranslations("role");
  const locale = useLocale();
  const { account, isConnecting, connect, hasInjected, isCorrectChain } =
    useWallet();
  const { roleKey, actor, isAdmin, isLoading } = useRole();

  return (
    <Container className="max-w-3xl py-12 sm:py-16 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      {!hasInjected ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("noInjected.title")}</CardTitle>
            <CardDescription>{t("noInjected.body")}</CardDescription>
          </CardHeader>
        </Card>
      ) : !account ? (
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>{t("connect.title")}</CardTitle>
            <CardDescription>{t("connect.body")}</CardDescription>
          </CardHeader>
          <Button onClick={() => void connect()} loading={isConnecting}>
            {t("connect.cta")}
          </Button>
        </Card>
      ) : isLoading ? (
        <Card className="flex items-center gap-3">
          <Spinner /> <span>{t("loading")}</span>
        </Card>
      ) : isAdmin ? (
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge tone="primary">{tRole("ADMIN")}</Badge>
              <span className="font-mono text-xs text-[var(--color-fg-muted)]">
                {shortAddress(account)}
              </span>
            </div>
            <CardTitle>{t("admin.title")}</CardTitle>
            <CardDescription>{t("admin.body")}</CardDescription>
          </CardHeader>
          <Link href={`/${locale}/dashboard/admin`}>
            <Button>{t("admin.cta")}</Button>
          </Link>
        </Card>
      ) : roleKey === "NONE" ? (
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>{t("noRole.title")}</CardTitle>
            <CardDescription>{t("noRole.body")}</CardDescription>
          </CardHeader>
          <Link href={`/${locale}/connect`}>
            <Button>{t("noRole.cta")}</Button>
          </Link>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge tone="primary">{tRole(roleKey)}</Badge>
              <span className="font-mono text-xs text-[var(--color-fg-muted)]">
                {shortAddress(account)}
              </span>
            </div>
            <CardTitle>{t("roleAssigned.title")}</CardTitle>
            <CardDescription>
              {actor
                ? t("roleAssigned.bodyWithName", {
                    name: actor.name,
                    country: actor.country,
                  })
                : t("roleAssigned.body")}
            </CardDescription>
          </CardHeader>
          {ROLE_LANDING[roleKey] ? (
            <Link
              href={`/${locale}${ROLE_LANDING[roleKey]!.path}`}
              className="contents"
            >
              <Button>{t(`roleAssigned.openPanel`)}</Button>
            </Link>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] p-4 text-sm text-[var(--color-fg-muted)]">
              {t("roleAssigned.placeholder")}
            </div>
          )}
        </Card>
      )}

      {!isCorrectChain && account ? (
        <p className="text-xs text-[var(--color-accent-warn)]">
          {t("wrongNetworkHint")}
        </p>
      ) : null}
    </Container>
  );
}
