"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { useChainEvents } from "@/hooks/useChainEvents";
import { useContract } from "@/hooks/useContract";
import { useTransaction } from "@/hooks/useTransaction";
import { hashDonorId } from "@/lib/hashing";
import { ADVERSE_KIND, type AdverseKindKey } from "@/lib/isbt";
import { shortAddress } from "@/lib/eth";

export function AuditorPanel() {
  const t = useTranslations("auditor");
  const traceability = useContract("HemaTraceability", { withSigner: true });
  const { run, isPending } = useTransaction();
  const { events, isLoading, refresh } = useChainEvents(40);

  const [kind, setKind] = useState<AdverseKindKey>("DonorPositive");
  const [trigger, setTrigger] = useState("");
  const [errors, setErrors] = useState<{ trigger?: string }>({});

  const triggerHash = trigger.trim() ? hashDonorId(trigger) : "";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (trigger.trim().length < 4) next.trigger = t("form.errors.trigger");
    setErrors(next);
    if (Object.keys(next).length > 0 || !traceability) return;

    const kindIdx = ADVERSE_KIND.indexOf(kind);
    const ok = await run(
      () => traceability.reportAdverseEvent(kindIdx, hashDonorId(trigger)),
      {
        messages: {
          pending: t("form.toast.pending"),
          success: t("form.toast.success"),
          errorPrefix: t("form.toast.error"),
        },
      },
    );
    if (ok) {
      setTrigger("");
      await refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="contents">
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>{t("form.title")}</CardTitle>
            <CardDescription>{t("form.subtitle")}</CardDescription>
          </CardHeader>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kind-select"
              className="text-sm font-medium text-[var(--color-fg)]"
            >
              {t("form.kind")}
            </label>
            <select
              id="kind-select"
              value={kind}
              onChange={(e) => setKind(e.target.value as AdverseKindKey)}
              className="h-11 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3.5 text-sm"
            >
              {ADVERSE_KIND.map((k) => (
                <option key={k} value={k}>
                  {t(`form.kinds.${k}`)}
                </option>
              ))}
            </select>
          </div>

          <InputField
            label={t("form.trigger")}
            placeholder={t("form.triggerPlaceholder")}
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            error={errors.trigger}
            hint={t(`form.triggerHints.${kind}`)}
          />

          {triggerHash ? (
            <p className="text-xs font-mono break-all rounded-xl bg-[var(--color-bg)] p-3 text-[var(--color-fg-muted)]">
              keccak256: {shortAddress(triggerHash, 12, 10)}
            </p>
          ) : null}

          <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
            <Button
              type="submit"
              loading={isPending}
              disabled={!traceability}
              variant={kind === "DonorPositive" ? "danger" : "primary"}
            >
              <AlertTriangle className="h-4 w-4" />
              {t("form.submit")}
            </Button>
          </div>
        </Card>
      </form>

      <Card className="flex flex-col gap-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("timeline.title")}</CardTitle>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              {t("timeline.refresh")}
            </button>
          </div>
          <CardDescription>{t("timeline.subtitle")}</CardDescription>
        </CardHeader>

        {events.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">
            {isLoading ? t("timeline.loading") : t("timeline.empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1 max-h-[40rem] overflow-y-auto pr-1">
            {events.map((e, i) => (
              <li
                key={`${e.txHash}-${e.logIndex}-${i}`}
                className="rounded-xl border border-[var(--color-border)] p-2 flex items-center gap-3 text-xs"
              >
                <span className="font-mono text-[var(--color-fg-subtle)] w-12 shrink-0">
                  #{e.blockNumber}
                </span>
                <Badge tone={toneFor(e.name)}>{e.name}</Badge>
                <span className="font-mono text-[var(--color-fg-muted)] truncate">
                  {summarise(e)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function toneFor(name: string): "neutral" | "ok" | "warn" | "critical" | "info" | "primary" {
  if (name.includes("Recalled") || name.includes("Adverse") || name.includes("LookBack"))
    return "critical";
  if (name.includes("Quarantined")) return "warn";
  if (name.includes("Released") || name.includes("Transfused")) return "ok";
  if (name.includes("CrossMatched") || name.includes("Produced")) return "primary";
  return "info";
}

function summarise(e: { name: string; args: readonly unknown[] }): string {
  const first = e.args[0];
  const second = e.args[1];
  if (typeof first === "bigint") {
    return `id=#${first.toString()}${
      typeof second === "string" ? ` · ${shortAddress(second)}` : ""
    }`;
  }
  if (typeof first === "string") {
    return `${shortAddress(first, 10, 6)}`;
  }
  return "";
}
