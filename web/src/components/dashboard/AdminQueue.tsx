"use client";

import { Check, RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useContract } from "@/hooks/useContract";
import {
  useRoleRequests,
  type PendingRoleRequest,
} from "@/hooks/useRoleRequests";
import { useTransaction } from "@/hooks/useTransaction";
import { shortAddress } from "@/lib/eth";

export function AdminQueue() {
  const t = useTranslations("admin");
  const tRole = useTranslations("role");
  const { pending, isLoading, error, refresh } = useRoleRequests();
  const registry = useContract("HemaRegistry", { withSigner: true });
  const { run, isPending: txPending } = useTransaction();

  async function approve(req: PendingRoleRequest) {
    if (!registry) return;
    const ok = await run(() => registry.approveRole(req.actor), {
      messages: {
        pending: t("toast.approvePending"),
        success: t("toast.approveSuccess", { name: req.name }),
        errorPrefix: t("toast.approveError"),
      },
    });
    if (ok) await refresh();
  }

  async function reject(req: PendingRoleRequest) {
    if (!registry) return;
    const ok = await run(() => registry.rejectRole(req.actor), {
      messages: {
        pending: t("toast.rejectPending"),
        success: t("toast.rejectSuccess", { name: req.name }),
        errorPrefix: t("toast.rejectError"),
      },
    });
    if (ok) await refresh();
  }

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{t("queue.title")}</CardTitle>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            aria-label={t("queue.refresh")}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            {t("queue.refresh")}
          </button>
        </div>
        <CardDescription>{t("queue.subtitle")}</CardDescription>
      </CardHeader>

      {error ? (
        <p className="text-sm text-[var(--color-accent-critical)]">{error}</p>
      ) : null}

      {isLoading && pending.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
          <Spinner /> <span>{t("queue.loading")}</span>
        </div>
      ) : pending.length === 0 ? (
        <p className="text-sm text-[var(--color-fg-muted)]">{t("queue.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((req) => (
            <li
              key={`${req.actor}-${req.role}-${req.blockNumber}`}
              className="rounded-2xl border border-[var(--color-border)] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge tone="primary">
                    {req.roleKey === "NONE" ? req.role : tRole(req.roleKey)}
                  </Badge>
                  <span className="font-mono text-xs text-[var(--color-fg-muted)]">
                    {shortAddress(req.actor)}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--color-fg)]">
                  {req.name}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  {t("queue.country", { country: req.country })} · block #{req.blockNumber}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void reject(req)}
                  disabled={txPending || !registry}
                >
                  <X className="h-4 w-4" />
                  {t("queue.reject")}
                </Button>
                <Button
                  size="sm"
                  onClick={() => void approve(req)}
                  disabled={txPending || !registry}
                >
                  <Check className="h-4 w-4" />
                  {t("queue.approve")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
