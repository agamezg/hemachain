import Link from "next/link";
import { Droplets, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Minimal chrome for the locale-less public verification surface. No wallet,
 * no role, no locale switch — a QR visitor lands here with nothing connected.
 */
export function PublicHeader() {
  const t = useTranslations();
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      <Container className="flex h-14 items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-[var(--color-fg)]">
          <Droplets className="h-5 w-5 text-[var(--color-primary)]" />
          <span className="font-semibold tracking-tight">{t("header.brand")}</span>
        </Link>
        <span className="flex items-center gap-1.5 text-sm text-[var(--color-fg-muted)]">
          <ShieldCheck className="h-4 w-4 text-[var(--color-accent-ok)]" />
          {t("verify.brand")}
        </span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
