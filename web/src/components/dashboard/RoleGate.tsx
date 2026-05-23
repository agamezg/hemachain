"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useRole } from "@/hooks/useRole";
import { useWallet } from "@/hooks/useWallet";
import type { RoleKey } from "@/config/roles";

interface RoleGateProps {
  requiredRole: RoleKey | "ADMIN";
  children: ReactNode;
}

export function RoleGate({ requiredRole, children }: RoleGateProps) {
  const t = useTranslations("dashboard");
  const tRole = useTranslations("role");
  const { account, hasInjected, isCorrectChain, connect, isConnecting } =
    useWallet();
  const { roleKey, isAdmin, isLoading } = useRole();

  if (!hasInjected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("noInjected.title")}</CardTitle>
          <CardDescription>{t("noInjected.body")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!account) {
    return (
      <Card className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>{t("connect.title")}</CardTitle>
          <CardDescription>{t("connect.body")}</CardDescription>
        </CardHeader>
        <Button onClick={() => void connect()} loading={isConnecting}>
          {t("connect.cta")}
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="flex items-center gap-3">
        <Spinner /> <span>{t("loading")}</span>
      </Card>
    );
  }

  const hasRequired =
    requiredRole === "ADMIN" ? isAdmin : roleKey === requiredRole;

  if (!hasRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("gate.deniedTitle")}</CardTitle>
          <CardDescription>
            {t("gate.deniedBody", { role: tRole(requiredRole) })}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isCorrectChain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("gate.wrongNetworkTitle")}</CardTitle>
          <CardDescription>{t("wrongNetworkHint")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <>{children}</>;
}
