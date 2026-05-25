"use client";

import {
  AlertTriangle,
  ArrowLeftRight,
  Ban,
  CheckCircle2,
  Droplet,
  FlaskConical,
  GitBranch,
  HeartPulse,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { TimelineEvent } from "@/hooks/useUnitDetail";
import { shortAddress } from "@/lib/eth";

type Tone = "neutral" | "ok" | "warn" | "critical" | "info" | "primary";

interface Props {
  events: TimelineEvent[];
  emptyLabel: string;
  /** When set (component view), custody temperatures outside the range render critical. */
  tempRange?: { min: number; max: number };
}

interface EventMeta {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  detail: string;
}

const TONE_RING: Record<Tone, string> = {
  neutral: "border-[var(--color-border-strong)] text-[var(--color-fg-muted)]",
  info: "border-[var(--color-accent-info)] text-[var(--color-accent-info)]",
  primary: "border-[var(--color-primary)] text-[var(--color-primary)]",
  ok: "border-[var(--color-accent-ok)] text-[var(--color-accent-ok)]",
  warn: "border-[var(--color-accent-warn)] text-[var(--color-accent-warn)]",
  critical:
    "border-[var(--color-accent-critical)] text-[var(--color-accent-critical)]",
};

/**
 * Public-facing event timeline. Renders the on-chain trail of a unit or
 * component as localized, human-readable rows with icons — the dev-oriented
 * tx/block detail stays subtle but present so the chain remains verifiable.
 */
export function TraceabilityTimeline({ events, emptyLabel, tempRange }: Props) {
  const t = useTranslations("traceTimeline");

  function describe(e: TimelineEvent): EventMeta {
    const a = e.args;
    switch (e.name) {
      case "DonationCollected":
        return {
          icon: Droplet,
          tone: "info",
          title: t("DonationCollected"),
          detail: t("volumeMl", { volume: Number(a[3]) }),
        };
      case "TestResultRecorded": {
        const anyPositive = Boolean(a[2]);
        return {
          icon: FlaskConical,
          tone: anyPositive ? "warn" : "info",
          title: t("TestResultRecorded"),
          detail: anyPositive ? t("testReactive") : t("testClear"),
        };
      }
      case "UnitReleased":
        return {
          icon: CheckCircle2,
          tone: "ok",
          title: t("UnitReleased"),
          detail: "",
        };
      case "UnitQuarantined":
        return {
          icon: AlertTriangle,
          tone: "warn",
          title: t("UnitQuarantined"),
          detail: a[2] ? t("reason", { reason: String(a[2]) }) : "",
        };
      case "UnitRecalled":
        return {
          icon: Ban,
          tone: "critical",
          title: t("UnitRecalled"),
          detail: a[1] ? t("reason", { reason: String(a[1]) }) : "",
        };
      case "ComponentProduced":
        return {
          icon: GitBranch,
          tone: "primary",
          title: t("ComponentProduced"),
          detail: t("volumeMl", { volume: Number(a[3]) }),
        };
      case "ComponentCustodyTransferred": {
        const temp = Number(a[3]);
        const outOfRange =
          tempRange !== undefined &&
          (temp < tempRange.min || temp > tempRange.max);
        return {
          icon: ArrowLeftRight,
          tone: outOfRange ? "critical" : "info",
          title: t("ComponentCustodyTransferred"),
          detail: t("custodyDetail", {
            temp,
            from: shortAddress(String(a[1])),
            to: shortAddress(String(a[2])),
          }),
        };
      }
      case "ComponentCrossMatched":
        return {
          icon: HeartPulse,
          tone: "primary",
          title: t("ComponentCrossMatched"),
          detail: t("patient", { hash: shortAddress(String(a[1]), 8, 6) }),
        };
      case "ComponentRecalled":
        return {
          icon: Ban,
          tone: "critical",
          title: t("ComponentRecalled"),
          detail: a[1] ? t("reason", { reason: String(a[1]) }) : "",
        };
      case "Transfused":
        return {
          icon: Syringe,
          tone: "ok",
          title: t("Transfused"),
          detail: "",
        };
      default:
        return { icon: Droplet, tone: "neutral", title: e.name, detail: "" };
    }
  }

  if (events.length === 0) {
    return <p className="text-sm text-[var(--color-fg-muted)]">{emptyLabel}</p>;
  }

  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const meta = describe(e);
        const Icon = meta.icon;
        const last = i === events.length - 1;
        return (
          <li key={`${e.txHash}-${e.logIndex}-${i}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--color-bg)] ${TONE_RING[meta.tone]}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {!last ? (
                <span
                  aria-hidden
                  className="w-0.5 flex-1 bg-[var(--color-border-strong)]"
                />
              ) : null}
            </div>
            <div className={`flex flex-col gap-0.5 ${last ? "" : "pb-5"}`}>
              <p className="text-sm font-medium text-[var(--color-fg)]">
                {meta.title}
              </p>
              {meta.detail ? (
                <p className="text-sm text-[var(--color-fg-muted)]">
                  {meta.detail}
                </p>
              ) : null}
              <span className="font-mono text-xs text-[var(--color-fg-subtle)]">
                {t("txRef", {
                  block: e.blockNumber,
                  tx: shortAddress(e.txHash, 8, 6),
                })}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
