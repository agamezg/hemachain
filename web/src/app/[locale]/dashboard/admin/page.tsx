"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { AdminQueue } from "@/components/dashboard/AdminQueue";
import { useRole } from "@/hooks/useRole";
import { useWallet } from "@/hooks/useWallet";

export default function AdminDashboard() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { account, hasInjected, connect, isConnecting } = useWallet();
  const { isAdmin, isLoading } = useRole();

  if (!hasInjected || !account) {
    return (
      <Container className="max-w-3xl py-12 sm:py-16 flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title")}
        </h1>
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>{t("denied.title")}</CardTitle>
            <CardDescription>{t("denied.connect")}</CardDescription>
          </CardHeader>
          {hasInjected ? (
            <Button onClick={() => void connect()} loading={isConnecting}>
              {t("denied.cta")}
            </Button>
          ) : null}
        </Card>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="max-w-3xl py-16 flex items-center gap-3">
        <Spinner /> <span>{t("loading")}</span>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container className="max-w-3xl py-12 sm:py-16 flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title")}
        </h1>
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>{t("denied.title")}</CardTitle>
            <CardDescription>{t("denied.body")}</CardDescription>
          </CardHeader>
          <Link href={`/${locale}/dashboard`}>
            <Button variant="secondary">{t("denied.back")}</Button>
          </Link>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-4xl py-12 sm:py-16 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>
      <AdminQueue />
    </Container>
  );
}
