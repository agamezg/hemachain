"use client";

import { Check, RefreshCw, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { useContract } from "@/hooks/useContract";
import { useDonations, type UnitView } from "@/hooks/useDonations";
import { useTransaction } from "@/hooks/useTransaction";
import { aboRhToBytes8, bytes8ToAboRh, ABO_RH_VALUES, type AboRhCode } from "@/lib/isbt";
import { shortAddress } from "@/lib/eth";

const SCREEN_KEYS = ["hiv", "hbv", "hcv", "syphilis", "htlv", "chagas"] as const;
type ScreenKey = (typeof SCREEN_KEYS)[number];

interface TestResultView {
  hiv: boolean;
  hbv: boolean;
  hcv: boolean;
  syphilis: boolean;
  htlv: boolean;
  chagas: boolean;
}

function positives(result: TestResultView): ScreenKey[] {
  return SCREEN_KEYS.filter((k) => result[k]);
}

export function ScreeningQueue() {
  const t = useTranslations("laboratorio");
  const traceability = useContract("HemaTraceability", { withSigner: true });
  const traceabilityRead = useContract("HemaTraceability");
  const { run, isPending } = useTransaction();

  const collected = useDonations({ statuses: ["Collected"] });
  const underTest = useDonations({ statuses: ["UnderTest"] });

  const [results, setResults] = useState<Record<string, TestResultView>>({});

  useEffect(() => {
    if (!traceabilityRead || underTest.units.length === 0) return;
    let cancelled = false;
    void (async () => {
      try {
        const entries = await Promise.all(
          underTest.units.map(async (u) => {
            const raw = (await traceabilityRead.getTestResult(u.id)) as readonly [
              bigint,
              string,
              bigint,
              boolean,
              boolean,
              boolean,
              boolean,
              boolean,
              boolean,
              string,
              bigint,
            ];
            return [
              u.id.toString(),
              {
                hiv: raw[3],
                hbv: raw[4],
                hcv: raw[5],
                syphilis: raw[6],
                htlv: raw[7],
                chagas: raw[8],
              } as TestResultView,
            ] as const;
          }),
        );
        if (cancelled) return;
        setResults((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      } catch {
        // Stale entries remain harmlessly — lookup is gated by current unit IDs.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [traceabilityRead, underTest.units]);

  async function refreshAll() {
    await Promise.all([collected.refresh(), underTest.refresh()]);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("queue.title")}</CardTitle>
            <button
              type="button"
              onClick={() => void refreshAll()}
              disabled={collected.isLoading || underTest.isLoading}
              className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  collected.isLoading || underTest.isLoading
                    ? "animate-spin"
                    : ""
                }`}
              />
              {t("queue.refresh")}
            </button>
          </div>
          <CardDescription>{t("queue.subtitle")}</CardDescription>
        </CardHeader>

        {collected.units.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">{t("queue.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {collected.units.map((u) => (
              <li
                key={u.id.toString()}
                className="rounded-2xl border border-[var(--color-border)] p-4 flex flex-col gap-3"
              >
                <ScreenRow
                  unit={u}
                  disabled={!traceability || isPending}
                  onSubmit={async (result) => {
                    const ok = await run(
                      () =>
                        traceability!.recordTestResult(
                          u.id,
                          result.hiv,
                          result.hbv,
                          result.hcv,
                          result.syphilis,
                          result.htlv,
                          result.chagas,
                          aboRhToBytes8(result.aboConfirmed),
                        ),
                      {
                        messages: {
                          pending: t("toast.recordPending"),
                          success: t("toast.recordSuccess", {
                            id: u.id.toString(),
                          }),
                          errorPrefix: t("toast.recordError"),
                        },
                      },
                    );
                    if (ok) await refreshAll();
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>{t("decisions.title")}</CardTitle>
          <CardDescription>{t("decisions.subtitle")}</CardDescription>
        </CardHeader>

        {underTest.units.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">
            {t("decisions.empty")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {underTest.units.map((u) => {
              const result = results[u.id.toString()];
              const pos = result ? positives(result) : null;
              const allNegative = pos !== null && pos.length === 0;
              return (
                <li
                  key={u.id.toString()}
                  className="rounded-2xl border border-[var(--color-border)] p-3 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-mono text-[var(--color-fg-muted)]">
                      #{u.id.toString()}
                    </span>
                    <Badge tone="primary">{t("decisions.underTest")}</Badge>
                    <span className="font-mono">{bytes8ToAboRh(u.aboRhCode)}</span>
                    <span className="font-mono text-xs text-[var(--color-fg-subtle)]">
                      {shortAddress(u.donorIdHash, 8, 6)}
                    </span>
                    {pos === null ? (
                      <Badge tone="neutral">{t("decisions.loadingResult")}</Badge>
                    ) : allNegative ? (
                      <Badge tone="ok">{t("decisions.allNegative")}</Badge>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {pos.map((k) => (
                          <Badge key={k} tone="critical">
                            {t(`screen.flag.${k}`)}+
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {pos !== null && !allNegative ? (
                    <p className="text-xs text-[var(--color-accent-warn)]">
                      {t("decisions.mustQuarantine")}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!traceability || isPending}
                      onClick={async () => {
                        const reason = window.prompt(t("decisions.reasonPrompt"));
                        if (!reason) return;
                        const ok = await run(
                          () => traceability!.quarantineUnit(u.id, reason),
                          {
                            messages: {
                              pending: t("toast.quarantinePending"),
                              success: t("toast.quarantineSuccess"),
                              errorPrefix: t("toast.quarantineError"),
                            },
                          },
                        );
                        if (ok) await refreshAll();
                      }}
                    >
                      <ShieldAlert className="h-4 w-4" />
                      {t("decisions.quarantine")}
                    </Button>
                    {allNegative ? (
                      <Button
                        size="sm"
                        disabled={!traceability || isPending}
                        onClick={async () => {
                          const ok = await run(
                            () => traceability!.releaseUnit(u.id),
                            {
                              messages: {
                                pending: t("toast.releasePending"),
                                success: t("toast.releaseSuccess"),
                                errorPrefix: t("toast.releaseError"),
                              },
                            },
                          );
                          if (ok) await refreshAll();
                        }}
                      >
                        <Check className="h-4 w-4" />
                        {t("decisions.release")}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

interface ScreenRowProps {
  unit: UnitView;
  disabled: boolean;
  onSubmit: (result: Record<ScreenKey, boolean> & { aboConfirmed: AboRhCode }) => Promise<void> | void;
}

function ScreenRow({ unit, disabled, onSubmit }: ScreenRowProps) {
  const t = useTranslations("laboratorio.screen");
  const [flags, setFlags] = useState<Record<ScreenKey, boolean>>({
    hiv: false,
    hbv: false,
    hcv: false,
    syphilis: false,
    htlv: false,
    chagas: false,
  });
  const [abo, setAbo] = useState<AboRhCode>(
    (bytes8ToAboRh(unit.aboRhCode) as AboRhCode) || "O+",
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-mono text-[var(--color-fg-muted)]">
          #{unit.id.toString()}
        </span>
        <Badge tone="info">{t("collected")}</Badge>
        <span className="font-mono">{bytes8ToAboRh(unit.aboRhCode)}</span>
        <span className="text-[var(--color-fg-muted)]">{unit.volumeMl} ml</span>
        <span className="font-mono text-xs text-[var(--color-fg-subtle)]">
          donor {shortAddress(unit.donorIdHash, 8, 6)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
        {SCREEN_KEYS.map((k) => (
          <label
            key={k}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-[var(--color-fg)] hover:border-[var(--color-border-strong)]"
          >
            <input
              type="checkbox"
              checked={flags[k]}
              onChange={(e) =>
                setFlags((f) => ({ ...f, [k]: e.target.checked }))
              }
              className="h-4 w-4 accent-[var(--color-accent-critical)]"
            />
            <span>{t(`flag.${k}`)}</span>
            {flags[k] ? (
              <Badge tone="critical" className="ml-auto">
                +
              </Badge>
            ) : (
              <span className="ml-auto text-xs text-[var(--color-fg-subtle)]">
                –
              </span>
            )}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={`abo-${unit.id}`}
            className="text-xs font-medium text-[var(--color-fg)]"
          >
            {t("aboConfirmed")}
          </label>
          <select
            id={`abo-${unit.id}`}
            value={abo}
            onChange={(e) => setAbo(e.target.value as AboRhCode)}
            className="h-9 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-sm font-mono"
          >
            {ABO_RH_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => void onSubmit({ ...flags, aboConfirmed: abo })}
        >
          {t("submit")}
        </Button>
      </div>
    </div>
  );
}
