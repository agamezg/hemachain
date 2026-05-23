import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function CtaSection() {
  const t = useTranslations("landing.cta");
  const locale = useLocale();
  return (
    <section className="pb-24">
      <Container>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-8 py-12 sm:px-12 sm:py-16 flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl flex flex-col gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
              {t("title")}
            </h2>
            <p className="text-sm text-[var(--color-fg-muted)]">{t("body")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${locale}/connect`}>
              <Button size="lg" variant="primary">
                {t("primary")}
              </Button>
            </Link>
            <a
              href="https://github.com/agamezg/hemachain/blob/main/docs/SDD.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="ghost">
                {t("secondary")}
              </Button>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
