"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { useContract } from "@/hooks/useContract";
import { useRole } from "@/hooks/useRole";
import { useTransaction } from "@/hooks/useTransaction";
import { useWallet } from "@/hooks/useWallet";
import { ROLE_HASH, type RoleKey } from "@/config/roles";

const REQUESTABLE_ROLES: Exclude<RoleKey, "ADMIN">[] = [
  "BANCO_SANGRE",
  "LABORATORIO",
  "FRACCIONAMIENTO",
  "MEDICINA_TRANSFUSIONAL",
  "AUDITOR",
  "CERTIFICADOR",
];

export function RoleRequestForm() {
  const t = useTranslations("connect");
  const tRole = useTranslations("role");
  const router = useRouter();
  const locale = useLocale();
  const { account, isCorrectChain, connect, hasInjected } = useWallet();
  const registry = useContract("HemaRegistry", { withSigner: true });
  const { roleKey, isAdmin, refresh } = useRole();
  const { run, isPending } = useTransaction();

  const [role, setRole] = useState<RoleKey>("BANCO_SANGRE");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("AR");
  const [errors, setErrors] = useState<{ name?: string; country?: string }>({});

  const alreadyHasRole = isAdmin || (roleKey !== "NONE");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = t("errors.name");
    if (country.trim().length !== 2) next.country = t("errors.country");
    setErrors(next);
    if (Object.keys(next).length > 0 || !registry) return;

    const receipt = await run(
      () =>
        registry.requestRole(
          ROLE_HASH[role],
          name.trim(),
          country.trim().toUpperCase(),
        ),
      {
        messages: {
          pending: t("toast.pending"),
          success: t("toast.success"),
          errorPrefix: t("toast.errorPrefix"),
        },
      },
    );
    if (receipt) {
      await refresh();
      router.push(`/${locale}/dashboard`);
    }
  }

  if (!hasInjected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("blocked.noInjected.title")}</CardTitle>
          <CardDescription>{t("blocked.noInjected.body")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>{t("blocked.notConnected.title")}</CardTitle>
          <CardDescription>{t("blocked.notConnected.body")}</CardDescription>
        </CardHeader>
        <Button onClick={() => void connect()}>{t("blocked.notConnected.cta")}</Button>
      </Card>
    );
  }

  if (alreadyHasRole) {
    return (
      <Card className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>{t("blocked.alreadyHasRole.title")}</CardTitle>
          <CardDescription>
            {t("blocked.alreadyHasRole.body", {
              role: isAdmin ? tRole("ADMIN") : tRole(roleKey),
            })}
          </CardDescription>
        </CardHeader>
        <Button onClick={() => router.push(`/${locale}/dashboard`)}>
          {t("blocked.alreadyHasRole.cta")}
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="contents">
      <Card className="flex flex-col gap-6">
        <CardHeader>
          <CardTitle>{t("form.title")}</CardTitle>
          <CardDescription>{t("form.subtitle")}</CardDescription>
        </CardHeader>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="role-select"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            {t("form.role")}
          </label>
          <select
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as RoleKey)}
            className="h-11 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3.5 text-sm text-[var(--color-fg)] focus:border-[var(--color-primary)] focus:outline-none"
          >
            {REQUESTABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {tRole(r)}
              </option>
            ))}
          </select>
        </div>

        <InputField
          label={t("form.name")}
          placeholder={t("form.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          maxLength={120}
        />

        <InputField
          label={t("form.country")}
          hint={t("form.countryHint")}
          value={country}
          onChange={(e) => setCountry(e.target.value.toUpperCase())}
          error={errors.country}
          maxLength={2}
        />

        <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-fg-subtle)]">
            {isCorrectChain
              ? t("form.networkOk")
              : t("form.networkWarning")}
          </p>
          <Button
            type="submit"
            loading={isPending}
            disabled={!registry || !isCorrectChain}
          >
            {t("form.submit")}
          </Button>
        </div>
      </Card>
    </form>
  );
}
