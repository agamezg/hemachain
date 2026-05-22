"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWallet } from "@/hooks/useWallet";
import { DEFAULT_CHAIN } from "@/config/chains";

export function WrongNetworkBanner() {
  const t = useTranslations("banner");
  const { account, isCorrectChain, switchChain } = useWallet();

  if (!account || isCorrectChain) return null;

  return (
    <div
      role="alert"
      className="border-b border-[var(--color-accent-warn)]/40 bg-[color-mix(in_srgb,var(--color-accent-warn)_15%,transparent)] text-[var(--color-accent-warn)]"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8 py-2 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1">
          {t("wrongNetwork", { expected: DEFAULT_CHAIN.shortName })}
        </span>
        <button
          type="button"
          onClick={() => void switchChain(DEFAULT_CHAIN)}
          className="rounded-full border border-current px-3 py-1 text-xs font-medium hover:bg-[color-mix(in_srgb,var(--color-accent-warn)_20%,transparent)]"
        >
          {t("switch", { network: DEFAULT_CHAIN.shortName })}
        </button>
      </div>
    </div>
  );
}
