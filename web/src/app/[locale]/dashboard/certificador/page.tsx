"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { CertificadorPanel } from "@/components/dashboard/CertificadorPanel";

export default function CertificadorPage() {
  const t = useTranslations("certificador");
  return (
    <Container className="max-w-3xl py-12 sm:py-16 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      <RoleGate requiredRole="CERTIFICADOR">
        <CertificadorPanel />
      </RoleGate>
    </Container>
  );
}
