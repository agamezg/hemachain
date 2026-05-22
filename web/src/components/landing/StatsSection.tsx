import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";

const stats = [
  { key: "donations", value: "—" },
  { key: "components", value: "—" },
  { key: "certificates", value: "—" },
  { key: "lookbacks", value: "—" },
] as const;

export function StatsSection() {
  const t = useTranslations("landing.stats");
  return (
    <section className="pb-20">
      <Container>
        <header className="mb-8 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
            {t("title")}
          </h2>
          <p className="text-sm text-[var(--color-fg-muted)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.key} className="flex flex-col gap-2">
              <span
                className="text-3xl font-bold font-mono text-[var(--color-fg)]"
                aria-hidden
              >
                {s.value}
              </span>
              <span className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">
                {t(s.key)}
              </span>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
