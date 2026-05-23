import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function Hero() {
  const t = useTranslations("landing.hero");
  const locale = useLocale();
  return (
    <section className="relative overflow-hidden pt-16 sm:pt-24 pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-72 bg-[radial-gradient(ellipse_at_top,_color-mix(in_srgb,var(--color-primary)_25%,transparent),transparent_70%)]"
      />
      <Container className="relative flex flex-col items-start gap-6 max-w-3xl">
        <Badge tone="primary">{t("eyebrow")}</Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title")}
        </h1>
        <p className="text-lg text-[var(--color-fg-muted)] max-w-2xl leading-relaxed">
          {t("subtitle")}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/verify">
            <Button size="lg" variant="primary">
              {t("ctaPrimary")}
            </Button>
          </Link>
          <Link href={`/${locale}/connect`}>
            <Button size="lg" variant="secondary">
              {t("ctaSecondary")}
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
