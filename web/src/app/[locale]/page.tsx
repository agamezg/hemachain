import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/landing/Hero";
import { StatsSection } from "@/components/landing/StatsSection";
import { InnovationSection } from "@/components/landing/InnovationSection";
import { RegulatorySection } from "@/components/landing/RegulatorySection";
import { CtaSection } from "@/components/landing/CtaSection";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <StatsSection />
      <InnovationSection />
      <RegulatorySection />
      <CtaSection />
    </>
  );
}
