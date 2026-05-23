"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { ComponentInventory } from "@/components/dashboard/ComponentInventory";
import { TransferCustodyForm } from "@/components/dashboard/TransferCustodyForm";

export default function BancoStoragePage() {
  const t = useTranslations("banco");
  const locale = useLocale();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Container className="max-w-5xl py-12 sm:py-16 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
        <nav className="flex gap-2 text-sm">
          <Link href={`/${locale}/dashboard/banco-sangre`}>
            <Button variant="secondary" size="sm">
              {t("navDonations")}
            </Button>
          </Link>
        </nav>
      </header>

      <RoleGate requiredRole="BANCO_SANGRE">
        <div key={refreshKey} className="flex flex-col gap-6">
          <ComponentInventory
            title={t("inventory.title")}
            subtitle={t("inventory.subtitle")}
          />
          <TransferCustodyForm
            onTransferred={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </RoleGate>
    </Container>
  );
}
