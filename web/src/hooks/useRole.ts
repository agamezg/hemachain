"use client";

import { useContext } from "react";
import { RoleContextObj } from "@/providers/RoleProvider";

export function useRole() {
  const ctx = useContext(RoleContextObj);
  if (!ctx) {
    throw new Error("useRole must be used within <RoleProvider>");
  }
  return ctx;
}
