import { setRequestLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { RoleRequestForm } from "@/components/dashboard/RoleRequestForm";

export default async function ConnectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("connect");

  return (
    <Container className="max-w-2xl py-12 sm:py-16 flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("hero.title")}
        </h1>
        <p className="text-base text-[var(--color-fg-muted)]">
          {t("hero.subtitle")}
        </p>
      </header>
      <RoleRequestForm />
    </Container>
  );
}
