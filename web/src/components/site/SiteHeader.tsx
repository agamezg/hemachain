import Link from "next/link";
import { useTranslations } from "next-intl";
import { Droplets } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitch } from "./LocaleSwitch";
import { WalletPill } from "./WalletPill";
import { NetworkBadge } from "./NetworkBadge";
import { RoleBadge } from "./RoleBadge";

export function SiteHeader({ locale }: { locale: string }) {
  const t = useTranslations();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_85%,transparent)] backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--color-bg)_70%,transparent)]">
      <Container className="flex h-14 items-center gap-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-[var(--color-fg)]"
        >
          <Droplets className="h-5 w-5 text-[var(--color-primary)]" />
          <span className="font-semibold tracking-tight">
            {t("header.brand")}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm text-[var(--color-fg-muted)]">
          <Link
            href={`/${locale}`}
            className="rounded-full px-3 py-1.5 hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-fg)]"
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/verify"
            className="rounded-full px-3 py-1.5 hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-fg)]"
          >
            {t("nav.verify")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2">
            <NetworkBadge />
            <RoleBadge />
          </div>
          <WalletPill />
          <LocaleSwitch />
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
