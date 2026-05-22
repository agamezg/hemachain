"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { useRole } from "@/hooks/useRole";

export function RoleBadge() {
  const t = useTranslations("role");
  const { roleKey, isLoading } = useRole();

  if (isLoading) {
    return <Badge tone="neutral">…</Badge>;
  }

  if (roleKey === "NONE") {
    return <Badge tone="neutral">{t("NONE")}</Badge>;
  }

  return <Badge tone="primary">{t(roleKey)}</Badge>;
}
