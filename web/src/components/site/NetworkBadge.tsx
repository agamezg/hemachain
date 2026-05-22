import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";

export function NetworkBadge() {
  const t = useTranslations("header");
  return (
    <Badge tone="info" aria-label={t("networkLocal")}>
      <span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent-info)]"
      />
      {t("networkLocal")}
    </Badge>
  );
}
