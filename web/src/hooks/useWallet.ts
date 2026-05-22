"use client";

import { useContext } from "react";
import { Web3ContextObj } from "@/providers/Web3Provider";

export function useWallet() {
  const ctx = useContext(Web3ContextObj);
  if (!ctx) {
    throw new Error("useWallet must be used within <Web3Provider>");
  }
  return ctx;
}
