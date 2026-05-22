import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";

export function SiteFooter() {
  const t = useTranslations();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-[var(--color-border)] py-10 text-sm text-[var(--color-fg-muted)]">
      <Container className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[var(--color-fg)] font-medium">
            HemaChain · © {year}
          </p>
          <p>{t("footer.tagline")}</p>
          <p className="text-xs text-[var(--color-fg-subtle)]">
            {t("footer.academy")}
          </p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li>
            <a
              href="https://github.com/agamezg/hemachain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-fg)]"
            >
              {t("footer.links.github")}
            </a>
          </li>
          <li>
            <a
              href="https://github.com/agamezg/hemachain/blob/main/docs/SDD.md"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-fg)]"
            >
              {t("footer.links.sdd")}
            </a>
          </li>
          <li>
            <a
              href="https://github.com/agamezg/hemachain#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-fg)]"
            >
              {t("footer.links.readme")}
            </a>
          </li>
        </ul>
      </Container>
    </footer>
  );
}
