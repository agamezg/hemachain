"use client";

import type { ContractTransactionResponse, ContractTransactionReceipt } from "ethers";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface TxMessages {
  pending: string;
  success: string;
  errorPrefix?: string;
}

interface RunOptions {
  messages: TxMessages;
}

export function useTransaction() {
  const t = useTranslations("tx");
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(
    async (
      thunk: () => Promise<ContractTransactionResponse>,
      { messages }: RunOptions,
    ): Promise<ContractTransactionReceipt | null> => {
      setIsPending(true);
      const toastId = toast.loading(messages.pending);
      try {
        const tx = await thunk();
        toast.loading(t("waiting"), { id: toastId, description: tx.hash });
        const receipt = await tx.wait();
        toast.success(messages.success, {
          id: toastId,
          description: receipt?.hash,
        });
        return receipt;
      } catch (err) {
        const reason =
          (err as { shortMessage?: string }).shortMessage ??
          (err as Error).message ??
          t("unknown");
        toast.error(
          messages.errorPrefix ? `${messages.errorPrefix}: ${reason}` : reason,
          { id: toastId },
        );
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [t],
  );

  return { run, isPending };
}
