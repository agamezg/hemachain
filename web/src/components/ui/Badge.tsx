import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "ok" | "warn" | "critical" | "info" | "primary";

const toneClasses: Record<Tone, string> = {
  neutral:
    "bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] border border-[var(--color-border)]",
  ok: "bg-[color-mix(in_srgb,var(--color-accent-ok)_15%,transparent)] text-[var(--color-accent-ok)] border border-[var(--color-accent-ok)]/30",
  warn: "bg-[color-mix(in_srgb,var(--color-accent-warn)_18%,transparent)] text-[var(--color-accent-warn)] border border-[var(--color-accent-warn)]/40",
  critical:
    "bg-[color-mix(in_srgb,var(--color-accent-critical)_15%,transparent)] text-[var(--color-accent-critical)] border border-[var(--color-accent-critical)]/40",
  info: "bg-[color-mix(in_srgb,var(--color-accent-info)_15%,transparent)] text-[var(--color-accent-info)] border border-[var(--color-accent-info)]/30",
  primary:
    "bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)] border border-[var(--color-primary)]/30",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "text-xs font-medium tracking-tight",
        toneClasses[tone],
        className,
      )}
      {...rest}
    />
  );
}
