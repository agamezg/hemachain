"use client";

import { Contract, type ContractRunner } from "ethers";
import { useMemo } from "react";
import {
  CONTRACTS,
  getContractAddress,
  type ContractName,
} from "@/config/contracts";
import { DEFAULT_CHAIN } from "@/config/chains";
import { useWallet } from "./useWallet";

interface UseContractOptions {
  withSigner?: boolean;
  chainId?: number;
}

export function useContract(
  name: ContractName,
  options: UseContractOptions = {},
): Contract | null {
  const { signer, isCorrectChain, readProvider } = useWallet();
  const targetChainId = options.chainId ?? DEFAULT_CHAIN.id;
  const wantSigner = options.withSigner ?? false;

  const address = useMemo(
    () => getContractAddress(name, targetChainId),
    [name, targetChainId],
  );

  return useMemo(() => {
    if (!address) return null;
    const runner: ContractRunner | null =
      wantSigner && signer && isCorrectChain ? signer : readProvider;
    return new Contract(address, CONTRACTS[name].abi, runner);
  }, [address, name, wantSigner, signer, isCorrectChain, readProvider]);
}
