"use client";

import { useTranslations } from "next-intl";
import { useWallet } from "@/hooks/useWallet";
import { ANVIL, SEPOLIA } from "@/config/chains";
import { Badge } from "@/components/ui/Badge";

export function NetworkBadge() {
  const t = useTranslations("network");
  const { chainId, hasInjected } = useWallet();

  if (!hasInjected || chainId === null) {
    return <Badge tone="neutral">{t("disconnected")}</Badge>;
  }

  if (chainId === ANVIL.id) {
    return (
      <Badge tone="info">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent-info)]"
        />
        {t("anvil")}
      </Badge>
    );
  }
  if (chainId === SEPOLIA.id) {
    return (
      <Badge tone="primary">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]"
        />
        {t("sepolia")}
      </Badge>
    );
  }
  return (
    <Badge tone="warn">
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent-warn)]"
      />
      {t("unknown")} · {chainId}
    </Badge>
  );
}
