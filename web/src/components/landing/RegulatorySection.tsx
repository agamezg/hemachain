import { useTranslations } from "next-intl";
import { ArrowUpRight, Scale } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

export function RegulatorySection() {
  const t = useTranslations("landing.regulatory");
  return (
    <section className="pb-20">
      <Container>
        <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4 max-w-3xl">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-accent-info)_15%,transparent)] text-[var(--color-accent-info)]">
              <Scale className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-[var(--color-fg)] tracking-tight">
                {t("title")}
              </h2>
              <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
                {t("body")}
              </p>
            </div>
          </div>
          <a
            href="https://github.com/agamezg/hemachain/blob/main/docs/SDD.md#22-marco-regulatorio--primario-argentina"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline whitespace-nowrap"
          >
            {t("link")}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </Card>
      </Container>
    </section>
  );
}
