import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { FACILITIES } from "@/config/facilities";
import { FacilityMap } from "./FacilityMap";

export function NetworkSection() {
  const t = useTranslations("landing.network");
  const tRole = useTranslations("role");

  const facilities = FACILITIES.map((f) => ({
    ...f,
    roleLabel: tRole(f.roleKey),
  }));

  return (
    <section className="pb-20">
      <Container>
        <header className="mb-8 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
            {t("title")}
          </h2>
          <p className="max-w-2xl text-sm text-[var(--color-fg-muted)]">
            {t("subtitle")}
          </p>
        </header>
        <FacilityMap facilities={facilities} />
      </Container>
    </section>
  );
}
