"use client";

import Link from "next/link";
import { Droplet } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import type { ComponentStatusKey, UnitStatusKey } from "@/lib/isbt";

type Tone = "neutral" | "ok" | "warn" | "critical" | "info" | "primary";

const UNIT_TONE: Record<UnitStatusKey, Tone> = {
  None: "neutral",
  Collected: "info",
  UnderTest: "warn",
  Quarantined: "warn",
  Released: "ok",
  Processed: "primary",
  Recalled: "critical",
};

const COMPONENT_TONE: Record<ComponentStatusKey, Tone> = {
  None: "neutral",
  Produced: "primary",
  InStorage: "info",
  Reserved: "warn",
  Transfused: "ok",
  Recalled: "critical",
};

export interface LineageRoot {
  id: bigint;
  label: string;
  volumeMl: number;
  status: UnitStatusKey;
}

export interface LineageChild {
  id: bigint;
  componentKey: string;
  volumeMl: number;
  status: ComponentStatusKey;
}

interface Props {
  root: LineageRoot;
  children: LineageChild[];
  /** Emphasizes the component the visitor arrived to verify. */
  highlightId?: bigint;
  unitHref?: (id: bigint) => string;
  componentHref?: (id: bigint) => string;
}

/**
 * Lineage of a donation: the whole-blood unit at the root, its derived
 * components as a flat one-level branch. The on-chain `Component` only
 * references `parentUnitId` (CRYO is a sibling, not a stored grandchild of
 * FFP), so the tree mirrors storage rather than inventing a deeper hierarchy.
 */
export function ComponentLineageTree({
  root,
  children,
  highlightId,
  unitHref,
  componentHref,
}: Props) {
  const tUnit = useTranslations("unitStatus");
  const tComp = useTranslations("componentStatus");

  const rootBody = (
    <span className="flex flex-wrap items-center gap-2">
      <Droplet className="h-4 w-4 text-[var(--color-primary)]" />
      <span className="font-mono text-sm text-[var(--color-fg)]">
        #{root.id.toString()}
      </span>
      <span className="text-sm text-[var(--color-fg-muted)]">{root.label}</span>
      <span className="font-mono text-xs text-[var(--color-fg-subtle)]">
        {root.volumeMl} ml
      </span>
      <Badge tone={UNIT_TONE[root.status]}>{tUnit(root.status)}</Badge>
    </span>
  );

  return (
    <div className="flex flex-col">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
        {unitHref ? (
          <Link href={unitHref(root.id)} className="hover:opacity-80">
            {rootBody}
          </Link>
        ) : (
          rootBody
        )}
      </div>

      {children.length > 0 ? (
        <ul className="mt-1 flex flex-col">
          {children.map((c, i) => {
            const last = i === children.length - 1;
            const highlighted = highlightId !== undefined && c.id === highlightId;
            const body = (
              <span
                className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${
                  highlighted
                    ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg)]"
                }`}
              >
                <span className="font-mono text-sm text-[var(--color-fg)]">
                  #{c.id.toString()}
                </span>
                <Badge tone="info">{c.componentKey}</Badge>
                <span className="font-mono text-xs text-[var(--color-fg-subtle)]">
                  {c.volumeMl} ml
                </span>
                <Badge tone={COMPONENT_TONE[c.status]}>
                  {tComp(c.status)}
                </Badge>
              </span>
            );
            return (
              <li key={c.id.toString()} className="relative pl-7">
                {/* vertical trunk: full height except the last child (stops at elbow) */}
                <span
                  aria-hidden
                  className={`absolute left-3 top-0 w-0.5 bg-[var(--color-border-strong)] ${
                    last ? "h-5" : "h-full"
                  }`}
                />
                {/* horizontal elbow into the node */}
                <span
                  aria-hidden
                  className="absolute left-3 top-5 h-0.5 w-3 bg-[var(--color-border-strong)]"
                />
                <div className="py-1">
                  {componentHref ? (
                    <Link
                      href={componentHref(c.id)}
                      className="block hover:opacity-80"
                    >
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
