"use client";

import { Droplet, Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { useComponents } from "@/hooks/useComponents";
import { useContract } from "@/hooks/useContract";
import { useTransaction } from "@/hooks/useTransaction";
import { useWallet } from "@/hooks/useWallet";
import { hashPatientId } from "@/lib/hashing";
import { shortAddress } from "@/lib/eth";

export function HospitalPanel() {
  const t = useTranslations("hospital");
  const { account } = useWallet();
  const traceability = useContract("HemaTraceability", { withSigner: true });
  const { run, isPending } = useTransaction();

  const ready = useComponents({
    custodian: account ?? undefined,
    statuses: ["Produced", "InStorage"],
  });
  const reserved = useComponents({
    custodian: account ?? undefined,
    statuses: ["Reserved"],
  });

  const [componentId, setComponentId] = useState<string>("");
  const [patientRef, setPatientRef] = useState("");
  const [errors, setErrors] = useState<{ componentId?: string; patient?: string }>({});

  const patientHash = patientRef.trim() ? hashPatientId(patientRef) : "";

  async function onCrossMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!componentId) next.componentId = t("crossMatch.errors.componentId");
    if (patientRef.trim().length < 4) next.patient = t("crossMatch.errors.patient");
    setErrors(next);
    if (Object.keys(next).length > 0 || !traceability) return;
    const ok = await run(
      () =>
        traceability.crossMatch(BigInt(componentId), hashPatientId(patientRef)),
      {
        messages: {
          pending: t("crossMatch.toast.pending"),
          success: t("crossMatch.toast.success"),
          errorPrefix: t("crossMatch.toast.error"),
        },
      },
    );
    if (ok) {
      setComponentId("");
      setPatientRef("");
      await ready.refresh();
      await reserved.refresh();
    }
  }

  async function transfuse(id: bigint) {
    if (!traceability) return;
    const ok = await run(() => traceability.recordTransfusion(id), {
      messages: {
        pending: t("transfuse.toast.pending"),
        success: t("transfuse.toast.success", { id: id.toString() }),
        errorPrefix: t("transfuse.toast.error"),
      },
    });
    if (ok) await reserved.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onCrossMatch} className="contents">
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>{t("crossMatch.title")}</CardTitle>
            <CardDescription>{t("crossMatch.subtitle")}</CardDescription>
          </CardHeader>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cm-component"
              className="text-sm font-medium text-[var(--color-fg)]"
            >
              {t("crossMatch.component")}
            </label>
            <select
              id="cm-component"
              value={componentId}
              onChange={(e) => setComponentId(e.target.value)}
              className="h-11 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3.5 text-sm font-mono"
            >
              <option value="">
                {ready.components.length === 0
                  ? t("crossMatch.noneAvailable")
                  : t("crossMatch.componentPlaceholder")}
              </option>
              {ready.components.map((c) => (
                <option key={c.id.toString()} value={c.id.toString()}>
                  #{c.id.toString()} · {c.componentKey} · {c.volumeMl} ml
                </option>
              ))}
            </select>
            {errors.componentId ? (
              <p className="text-xs text-[var(--color-accent-critical)]">
                {errors.componentId}
              </p>
            ) : null}
          </div>

          <InputField
            label={t("crossMatch.patient")}
            placeholder="HC-2026-…"
            value={patientRef}
            onChange={(e) => setPatientRef(e.target.value)}
            error={errors.patient}
            hint={t("crossMatch.patientHint")}
          />

          {patientHash ? (
            <p className="text-xs font-mono break-all rounded-xl bg-[var(--color-bg)] p-3 text-[var(--color-fg-muted)]">
              keccak256: {shortAddress(patientHash, 12, 10)}
            </p>
          ) : null}

          <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
            <Button
              type="submit"
              loading={isPending}
              disabled={!traceability || ready.components.length === 0}
            >
              <Droplet className="h-4 w-4" />
              {t("crossMatch.submit")}
            </Button>
          </div>
        </Card>
      </form>

      <Card className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>{t("transfuse.title")}</CardTitle>
          <CardDescription>{t("transfuse.subtitle")}</CardDescription>
        </CardHeader>

        {reserved.components.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">
            {t("transfuse.empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reserved.components.map((c) => (
              <li
                key={c.id.toString()}
                className="rounded-2xl border border-[var(--color-border)] p-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-[var(--color-fg-muted)]">
                    #{c.id.toString()}
                  </span>
                  <Badge tone="primary">{t("transfuse.reserved")}</Badge>
                  <span className="font-mono">{c.componentKey}</span>
                  <span className="text-[var(--color-fg-muted)]">
                    {c.volumeMl} ml
                  </span>
                </div>
                <Button
                  size="sm"
                  disabled={isPending || !traceability}
                  onClick={() => void transfuse(c.id)}
                >
                  <Heart className="h-4 w-4" />
                  {t("transfuse.cta")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
