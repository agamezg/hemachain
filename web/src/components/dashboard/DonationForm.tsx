"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { useContract } from "@/hooks/useContract";
import { useTransaction } from "@/hooks/useTransaction";
import { hashDonorId } from "@/lib/hashing";
import { ABO_RH_VALUES, type AboRhCode, aboRhToBytes8 } from "@/lib/isbt";
import { shortAddress } from "@/lib/eth";

interface Props {
  onRegistered?: () => void;
}

export function DonationForm({ onRegistered }: Props) {
  const t = useTranslations("bancoSangre.form");
  const traceability = useContract("HemaTraceability", { withSigner: true });
  const { run, isPending } = useTransaction();

  const [dni, setDni] = useState("");
  const [volume, setVolume] = useState(450);
  const [abo, setAbo] = useState<AboRhCode>("O+");
  const [errors, setErrors] = useState<{ dni?: string; volume?: string }>({});

  const donorHash = useMemo(() => (dni.trim() ? hashDonorId(dni) : ""), [dni]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (dni.trim().length < 4) next.dni = t("errors.dni");
    if (volume < 100 || volume > 500) next.volume = t("errors.volume");
    setErrors(next);
    if (Object.keys(next).length > 0 || !traceability) return;

    const ok = await run(
      () =>
        traceability.registerDonation(
          hashDonorId(dni),
          volume,
          aboRhToBytes8(abo),
        ),
      {
        messages: {
          pending: t("toast.pending"),
          success: t("toast.success"),
          errorPrefix: t("toast.errorPrefix"),
        },
      },
    );
    if (ok) {
      setDni("");
      setVolume(450);
      onRegistered?.();
    }
  }

  return (
    <form onSubmit={onSubmit} className="contents">
      <Card className="flex flex-col gap-5">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>

        <InputField
          label={t("dni")}
          placeholder="36123456"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          hint={t("dniHint")}
          error={errors.dni}
        />

        {donorHash ? (
          <p className="text-xs font-mono break-all rounded-xl bg-[var(--color-bg)] p-3 text-[var(--color-fg-muted)]">
            keccak256: {shortAddress(donorHash, 12, 10)}
          </p>
        ) : null}

        <InputField
          label={t("volume")}
          type="number"
          min={100}
          max={500}
          step={10}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          hint={t("volumeHint")}
          error={errors.volume}
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="abo-select"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            {t("abo")}
          </label>
          <select
            id="abo-select"
            value={abo}
            onChange={(e) => setAbo(e.target.value as AboRhCode)}
            className="h-11 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3.5 text-sm font-mono text-[var(--color-fg)] focus:border-[var(--color-primary)] focus:outline-none"
          >
            {ABO_RH_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
          <Button type="submit" loading={isPending} disabled={!traceability}>
            {t("submit")}
          </Button>
        </div>
      </Card>
    </form>
  );
}
