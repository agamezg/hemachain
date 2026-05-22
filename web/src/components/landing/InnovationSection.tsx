import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Award,
  ShieldCheck,
  Snowflake,
  TestTube,
  QrCode,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

const cards = [
  { key: "lookback", Icon: AlertTriangle },
  { key: "coldChain", Icon: Snowflake },
  { key: "certificates", Icon: Award },
  { key: "privacy", Icon: ShieldCheck },
  { key: "chagas", Icon: TestTube },
  { key: "public", Icon: QrCode },
] as const;

export function InnovationSection() {
  const t = useTranslations("landing.innovation");
  return (
    <section className="pb-20">
      <Container>
        <header className="mb-10 flex flex-col gap-2 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
            {t("title")}
          </h2>
          <p className="text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
        </header>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ key, Icon }) => (
            <Card key={key} className="flex flex-col gap-4">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[var(--color-primary)]">
                <Icon className="h-5 w-5" />
              </span>
              <CardHeader className="mb-0">
                <CardTitle>{t(`cards.${key}.title`)}</CardTitle>
                <CardDescription>{t(`cards.${key}.body`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
