"use client";

import { Thermometer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";

interface Props {
  /** Custody temperatures (°C), in chronological order. */
  readings: number[];
  /** Admissible range for the component type. */
  range: { min: number; max: number };
}

const W = 140;
const H = 40;
const PAD = 5;

/**
 * Cold-chain integrity at a glance: an inline-SVG sparkline of the custody
 * temperature readings (from `ComponentCustodyTransferred` logs) over the safe
 * band. Any reading outside the band renders critical — the same gate the
 * contract enforces via `INV_ColdChainGate`.
 */
export function ColdChainBadge({ readings, range }: Props) {
  const t = useTranslations("coldChain");

  if (readings.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
        <Thermometer className="h-4 w-4" />
        <span>{t("noData")}</span>
      </div>
    );
  }

  const breached = readings.some((r) => r < range.min || r > range.max);
  const lo = Math.min(range.min, ...readings) - 1;
  const hi = Math.max(range.max, ...readings) + 1;
  const span = hi - lo || 1;

  const scaleY = (v: number) => PAD + (hi - v) * ((H - 2 * PAD) / span);
  const scaleX = (i: number) =>
    readings.length === 1
      ? W / 2
      : PAD + (i * (W - 2 * PAD)) / (readings.length - 1);

  const points = readings.map((r, i) => ({
    x: scaleX(i),
    y: scaleY(r),
    out: r < range.min || r > range.max,
  }));
  const path = points.map((p) => `${p.x},${p.y}`).join(" ");

  const bandTop = scaleY(range.max);
  const bandH = scaleY(range.min) - bandTop;
  const last = readings[readings.length - 1];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Thermometer className="h-4 w-4 text-[var(--color-fg-muted)]" />
        <Badge tone={breached ? "critical" : "ok"}>
          {breached ? t("breached") : t("intact")}
        </Badge>
        <span className="font-mono text-xs text-[var(--color-fg-subtle)]">
          {t("range", { min: range.min, max: range.max })}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-10 w-[140px]"
        role="img"
        aria-label={t("aria", { last })}
      >
        <rect
          x={0}
          y={bandTop}
          width={W}
          height={bandH}
          className="fill-[color-mix(in_srgb,var(--color-accent-ok)_18%,transparent)]"
        />
        {readings.length > 1 ? (
          <polyline
            points={path}
            fill="none"
            className="stroke-[var(--color-fg-muted)]"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        ) : null}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.5}
            className={
              p.out
                ? "fill-[var(--color-accent-critical)]"
                : "fill-[var(--color-accent-ok)]"
            }
          />
        ))}
      </svg>
    </div>
  );
}
