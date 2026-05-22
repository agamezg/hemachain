"use client";

import { Copy, LogOut, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { shortAddress } from "@/lib/eth";

export function WalletPill() {
  const t = useTranslations("wallet");
  const { account, hasInjected, isConnecting, connect, disconnect } =
    useWallet();
  const [open, setOpen] = useState(false);

  if (!hasInjected) {
    return (
      <span
        title={t("noWallet")}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3.5 text-xs font-medium text-[var(--color-fg-subtle)]"
      >
        <Wallet className="h-3.5 w-3.5" />
        {t("noWallet")}
      </span>
    );
  }

  if (!account) {
    return (
      <button
        type="button"
        onClick={() => void connect()}
        disabled={isConnecting}
        className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--color-primary)] px-3.5 text-xs font-medium text-[var(--color-primary-fg)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        <Wallet className="h-3.5 w-3.5" />
        {isConnecting ? t("connecting") : t("connect")}
      </button>
    );
  }

  async function copy() {
    if (!account) return;
    await navigator.clipboard.writeText(account);
    toast.success(t("copied"));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3.5 text-xs font-medium font-mono text-[var(--color-fg)] hover:border-[var(--color-border-strong)]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent-ok)]"
        />
        {shortAddress(account)}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              void copy();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg)]"
          >
            <Copy className="h-4 w-4" />
            {t("copyAddress")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-[var(--color-accent-critical)] hover:bg-[var(--color-bg)]"
          >
            <LogOut className="h-4 w-4" />
            {t("disconnect")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
