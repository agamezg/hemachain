"use client";

import { Ban } from "lucide-react";
import { use, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { InputField } from "@/components/ui/InputField";
import { Spinner } from "@/components/ui/Spinner";
import { CertificateNFTCard } from "@/components/certificates/CertificateNFTCard";
import { useCertificateDetail } from "@/hooks/useCertificateDetail";
import { useContract } from "@/hooks/useContract";
import { useRole } from "@/hooks/useRole";
import { useTransaction } from "@/hooks/useTransaction";

interface PageProps {
  params: Promise<{ locale: string; tokenId: string }>;
}

export default function CertificateDetailPage({ params }: PageProps) {
  const { tokenId: rawId } = use(params);
  const locale = useLocale();
  const t = useTranslations("certificateDetail");

  const tokenId = /^\d+$/.test(rawId) ? BigInt(rawId) : null;
  const { data, isLoading, error, verification, refresh } =
    useCertificateDetail(tokenId);

  const { roleKey } = useRole();
  const cert = useContract("HemaCertificate", { withSigner: true });
  const { run, isPending } = useTransaction();
  const [reason, setReason] = useState("");
  const [showRevoke, setShowRevoke] = useState(false);

  const origin = useState(() =>
    typeof window !== "undefined" ? window.location.origin : "",
  )[0];
  const verifyUrl = origin
    ? `${origin}/${locale}/certificates/${rawId}`
    : "";

  async function onRevoke() {
    if (!cert || tokenId === null || reason.trim().length < 3) return;
    const receipt = await run(
      () => cert.revokeCertificate(tokenId, reason.trim()),
      {
        messages: {
          pending: t("revoke.toast.pending"),
          success: t("revoke.toast.success"),
          errorPrefix: t("revoke.toast.error"),
        },
      },
    );
    if (receipt) {
      setShowRevoke(false);
      setReason("");
      await refresh();
    }
  }

  if (tokenId === null) {
    return (
      <Container className="max-w-3xl py-12 sm:py-16">
        <Card>
          <CardHeader>
            <CardTitle>{t("invalidId")}</CardTitle>
            <CardDescription>{t("invalidIdBody")}</CardDescription>
          </CardHeader>
        </Card>
      </Container>
    );
  }

  const canRevoke =
    roleKey === "CERTIFICADOR" && data?.status === "Valid";

  return (
    <Container className="max-w-3xl py-12 sm:py-16 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
          {t("title", { id: rawId })}
        </h1>
        <p className="text-sm text-[var(--color-fg-muted)]">{t("subtitle")}</p>
      </header>

      {isLoading || !data ? (
        error === "not_found" ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("notFound")}</CardTitle>
              <CardDescription>{t("notFoundBody", { id: rawId })}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="flex items-center gap-3">
            <Spinner /> <span>{t("loading")}</span>
          </Card>
        )
      ) : (
        <>
          <CertificateNFTCard
            detail={data}
            verification={verification}
            verifyUrl={verifyUrl}
          />

          {canRevoke ? (
            <Card className="flex flex-col gap-3">
              <CardHeader>
                <CardTitle>{t("revoke.title")}</CardTitle>
                <CardDescription>{t("revoke.subtitle")}</CardDescription>
              </CardHeader>
              {showRevoke ? (
                <div className="flex flex-col gap-3">
                  <InputField
                    label={t("revoke.reason")}
                    placeholder={t("revoke.reasonPlaceholder")}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setShowRevoke(false)}>
                      {t("revoke.cancel")}
                    </Button>
                    <Button
                      variant="danger"
                      loading={isPending}
                      disabled={reason.trim().length < 3}
                      onClick={() => void onRevoke()}
                    >
                      <Ban className="h-4 w-4" />
                      {t("revoke.confirm")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="danger"
                  className="self-start"
                  onClick={() => setShowRevoke(true)}
                >
                  <Ban className="h-4 w-4" />
                  {t("revoke.cta")}
                </Button>
              )}
            </Card>
          ) : null}
        </>
      )}
    </Container>
  );
}
