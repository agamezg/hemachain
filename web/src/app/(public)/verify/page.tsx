"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { InputField } from "@/components/ui/InputField";

type Kind = "u" | "c";

export default function VerifySearchPage() {
  const t = useTranslations("verify.search");
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("c");
  const [id, setId] = useState("");

  const numeric = /^\d+$/.test(id.trim());

  function submit() {
    if (!numeric) return;
    router.push(`/verify/${kind}${id.trim()}`);
  }

  return (
    <Container className="max-w-xl py-12 sm:py-16">
      <Card className="flex flex-col gap-5">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>

        <div className="flex gap-2">
          {(["c", "u"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex-1 rounded-[var(--radius-input)] border px-3 py-2 text-sm transition-colors ${
                kind === k
                  ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              {k === "c" ? t("component") : t("unit")}
            </button>
          ))}
        </div>

        <InputField
          label={t("idLabel")}
          inputMode="numeric"
          placeholder={t("idPlaceholder")}
          value={id}
          onChange={(e) => setId(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />

        <Button onClick={submit} disabled={!numeric}>
          <Search className="h-4 w-4" />
          {t("cta")}
        </Button>

        <p className="text-xs text-[var(--color-fg-muted)]">{t("hint")}</p>
      </Card>
    </Container>
  );
}
