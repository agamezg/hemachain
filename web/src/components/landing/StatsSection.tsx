"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { useContract } from "@/hooks/useContract";
import { useEventStream, type LiveEvent } from "@/hooks/useEventStream";

type CountKey = "donations" | "components" | "certificates" | "lookbacks";
type Counts = Record<CountKey, number | null>;

const initial: Counts = {
  donations: null,
  components: null,
  certificates: null,
  lookbacks: null,
};

// Map each live SSE event to the counter it should increment. Keeping the
// table tiny and explicit avoids drifting if the indexer adds new events.
const LIVE_BUMPS: Record<string, CountKey> = {
  DonationCollected: "donations",
  ComponentProduced: "components",
  CertificateIssued: "certificates",
  AdverseEventReported: "lookbacks",
};

export function StatsSection() {
  const t = useTranslations("landing.stats");
  const trace = useContract("HemaTraceability");
  const cert = useContract("HemaCertificate");
  const [counts, setCounts] = useState<Counts>(initial);

  // Initial fetch: ask the chain how many of each event have happened. Reads
  // through the readonly provider, so the landing works without a wallet.
  useEffect(() => {
    if (!trace || !cert) return;
    let cancelled = false;
    (async () => {
      try {
        const [donations, components, certificates, lookbacks] =
          await Promise.all([
            trace.queryFilter(trace.filters.DonationCollected()),
            trace.queryFilter(trace.filters.ComponentProduced()),
            cert.queryFilter(cert.filters.CertificateIssued()),
            trace.queryFilter(trace.filters.AdverseEventReported()),
          ]);
        if (cancelled) return;
        setCounts({
          donations: donations.length,
          components: components.length,
          certificates: certificates.length,
          lookbacks: lookbacks.length,
        });
      } catch {
        /* network/RPC down — counts stay null, cards render "—" */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trace, cert]);

  // Live updates: when the indexer pushes a matching event, bump the counter
  // without re-querying the chain. If the indexer isn't running, EventSource
  // just stays disconnected and the initial fetch is what the user sees.
  useEventStream((e: LiveEvent) => {
    const key = LIVE_BUMPS[e.name];
    if (!key) return;
    setCounts((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
  });

  return (
    <section className="pb-20">
      <Container>
        <header className="mb-8 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-fg)]">
            {t("title")}
          </h2>
          <p className="text-sm text-[var(--color-fg-muted)] max-w-2xl">
            {t("subtitle")}
          </p>
        </header>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(initial) as CountKey[]).map((key) => {
            const value = counts[key];
            return (
              <Card key={key} className="flex flex-col gap-2">
                <span
                  className="text-3xl font-bold font-mono text-[var(--color-fg)] tabular-nums"
                  aria-live="polite"
                >
                  {value === null ? "—" : value.toLocaleString()}
                </span>
                <span className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">
                  {t(key)}
                </span>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
