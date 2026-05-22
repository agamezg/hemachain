import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";

export function RoleBadge() {
  const t = useTranslations("header");
  return <Badge tone="neutral">{t("roleStub")}</Badge>;
}
