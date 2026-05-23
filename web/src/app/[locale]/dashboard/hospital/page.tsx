"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { ComponentInventory } from "@/components/dashboard/ComponentInventory";
import { HospitalPanel } from "@/components/dashboard/HospitalPanel";

export default function HospitalPage() {
  const t = useTranslations("hospital");
  return (
    <Container className="max-w-5xl py-12 sm:py-16 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      <RoleGate requiredRole="MEDICINA_TRANSFUSIONAL">
        <ComponentInventory
          title={t("inventory.title")}
          subtitle={t("inventory.subtitle")}
        />
        <HospitalPanel />
      </RoleGate>
    </Container>
  );
}
