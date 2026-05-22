"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { routing, type Locale } from "@/i18n/routing";

export function LocaleSwitch() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function onChange(next: string) {
    const stripped = pathname.replace(/^\/(es|pt|en)(?=\/|$)/, "") || "/";
    const target = `/${next}${stripped === "/" ? "" : stripped}`;
    startTransition(() => router.replace(target));
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("label")}</span>
      <select
        aria-label={t("label")}
        value={locale}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] pl-3 pr-7 text-xs font-medium text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] focus:outline-none"
      >
        {routing.locales.map((l: Locale) => (
          <option key={l} value={l} className="bg-[var(--color-bg-elevated)] text-[var(--color-fg)]">
            {t(l)}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2 text-[var(--color-fg-subtle)]">
        ▾
      </span>
    </label>
  );
}
