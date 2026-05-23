"use client";

import { keccak256, toUtf8Bytes } from "ethers";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { useComponents } from "@/hooks/useComponents";
import { useContract } from "@/hooks/useContract";
import { useTransaction } from "@/hooks/useTransaction";
import { useWallet } from "@/hooks/useWallet";
import { COMPONENT_TYPES } from "@/lib/isbt";

interface Props {
  onTransferred?: () => void;
}

export function TransferCustodyForm({ onTransferred }: Props) {
  const t = useTranslations("banco.transfer");
  const { account } = useWallet();
  const traceability = useContract("HemaTraceability", { withSigner: true });
  const { run, isPending } = useTransaction();
  const { components } = useComponents({
    custodian: account ?? undefined,
    statuses: ["Produced", "InStorage"],
  });

  const [componentId, setComponentId] = useState<string>("");
  const [to, setTo] = useState("");
  const [temp, setTemp] = useState<number>(4);
  const [location, setLocation] = useState("Buenos Aires");
  const [handoff, setHandoff] = useState("standard-handoff");
  const [errors, setErrors] = useState<{ to?: string; componentId?: string }>({});

  const selected = components.find((c) => c.id.toString() === componentId);
  const def = selected
    ? COMPONENT_TYPES.find((d) => d.key === selected.componentKey)
    : undefined;
  const tempOutOfRange =
    def !== undefined && (temp < def.tempMin || temp > def.tempMax);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!componentId) next.componentId = t("errors.componentId");
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) next.to = t("errors.to");
    setErrors(next);
    if (Object.keys(next).length > 0 || !traceability) return;

    const gpsHash = keccak256(toUtf8Bytes(`demo:gps:${location.trim()}`));
    const signedHandoffHash = keccak256(
      toUtf8Bytes(`demo:handoff:${handoff.trim()}:${Date.now()}`),
    );

    const ok = await run(
      () =>
        traceability.transferComponentCustody(
          BigInt(componentId),
          to,
          temp,
          gpsHash,
          signedHandoffHash,
        ),
      {
        messages: {
          pending: t("toast.pending"),
          success: tempOutOfRange
            ? t("toast.successButRecalled")
            : t("toast.success"),
          errorPrefix: t("toast.error"),
        },
      },
    );
    if (ok) {
      setComponentId("");
      setTo("");
      onTransferred?.();
    }
  }

  return (
    <form onSubmit={onSubmit} className="contents">
      <Card className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="component-select"
            className="text-sm font-medium text-[var(--color-fg)]"
          >
            {t("component")}
          </label>
          <select
            id="component-select"
            value={componentId}
            onChange={(e) => setComponentId(e.target.value)}
            className="h-11 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3.5 text-sm font-mono"
          >
            <option value="">{t("componentPlaceholder")}</option>
            {components.map((c) => (
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
          label={t("to")}
          placeholder="0x…"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          error={errors.to}
          hint={t("toHint")}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InputField
            label={t("temperature")}
            type="number"
            min={-80}
            max={80}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            hint={def ? `${def.tempMin}..${def.tempMax} °C` : undefined}
          />
          <InputField
            label={t("location")}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            hint={t("locationHint")}
          />
          <InputField
            label={t("handoff")}
            value={handoff}
            onChange={(e) => setHandoff(e.target.value)}
            hint={t("handoffHint")}
          />
        </div>

        {selected && tempOutOfRange ? (
          <p className="text-xs text-[var(--color-accent-warn)]">
            {t("tempWarning")}
          </p>
        ) : null}

        <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
          <Button
            type="submit"
            loading={isPending}
            disabled={!traceability || components.length === 0}
            variant={tempOutOfRange ? "danger" : "primary"}
          >
            {tempOutOfRange ? t("submitRecall") : t("submit")}
          </Button>
        </div>
      </Card>
    </form>
  );
}
