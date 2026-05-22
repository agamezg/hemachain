"use client";

import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";

export function WalletPill() {
  const t = useTranslations("wallet");
  return (
    <button
      type="button"
      disabled
      title="Phase 3"
      className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-[var(--color-border-strong)] bg-transparent px-3.5 text-xs font-medium text-[var(--color-fg-muted)] opacity-80"
    >
      <Wallet className="h-3.5 w-3.5" />
      {t("connect")}
    </button>
  );
}
