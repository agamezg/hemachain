"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { RoleGate } from "@/components/dashboard/RoleGate";
import { DonationForm } from "@/components/dashboard/DonationForm";
import { DonationList } from "@/components/dashboard/DonationList";

export default function BancoSangrePage() {
  const t = useTranslations("bancoSangre");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Container className="max-w-5xl py-12 sm:py-16 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      <RoleGate requiredRole="BANCO_SANGRE">
        <div className="grid lg:grid-cols-[1fr,1.2fr] gap-6 items-start">
          <DonationForm onRegistered={() => setRefreshKey((k) => k + 1)} />
          <DonationList key={refreshKey} />
        </div>
      </RoleGate>
    </Container>
  );
}
