"use client";

import {
  Award,
  ExternalLink,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { QRVerifyCode } from "@/components/certificates/QRVerifyCode";
import type { CertificateDetail, VerificationState } from "@/hooks/useCertificateDetail";
import { certStatusTone } from "@/lib/cert";
import { shortAddress } from "@/lib/eth";

interface CertificateNFTCardProps {
  detail: CertificateDetail;
  verification: VerificationState;
  /** Absolute URL encoded in the QR. */
  verifyUrl: string;
}

export function CertificateNFTCard({
  detail,
  verification,
  verifyUrl,
}: CertificateNFTCardProps) {
  const t = useTranslations("certificateDetail");
  const tType = useTranslations("certType");
  const tStatus = useTranslations("certStatus");

  const fmt = (ts: bigint) => new Date(Number(ts) * 1000).toLocaleDateString();

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Award className="h-5 w-5 text-[var(--color-primary)]" />
          <CardTitle>{tType(detail.certTypeKey)}</CardTitle>
          <Badge tone={certStatusTone(detail.status)}>
            {tStatus(detail.status)}
          </Badge>
          <span className="font-mono text-xs text-[var(--color-fg-muted)]">
            #{detail.tokenId.toString()}
          </span>
        </div>
      </CardHeader>

      <VerificationBanner verification={verification} />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <dl className="grid flex-1 grid-cols-1 gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
          <dt className="text-[var(--color-fg-muted)]">{t("subject")}</dt>
          <dd className="font-mono break-all">{shortAddress(detail.owner, 10, 8)}</dd>
          <dt className="text-[var(--color-fg-muted)]">{t("issuer")}</dt>
          <dd className="font-mono break-all">{shortAddress(detail.issuer, 10, 8)}</dd>
          <dt className="text-[var(--color-fg-muted)]">{t("issuedAt")}</dt>
          <dd>{fmt(detail.issuedAt)}</dd>
          <dt className="text-[var(--color-fg-muted)]">{t("expiresAt")}</dt>
          <dd>{fmt(detail.expiresAt)}</dd>
          <dt className="text-[var(--color-fg-muted)]">{t("documentHash")}</dt>
          <dd className="font-mono break-all text-xs">{detail.documentHash}</dd>
          <dt className="text-[var(--color-fg-muted)]">{t("cid")}</dt>
          <dd className="font-mono break-all text-xs">{detail.ipfsCID}</dd>
        </dl>

        <div className="flex flex-col items-center gap-2">
          <QRVerifyCode url={verifyUrl} />
          <span className="text-xs text-[var(--color-fg-muted)]">{t("qrHint")}</span>
        </div>
      </div>

      {verification.state !== "idle" ? (
        <a
          href={verification.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start text-sm text-[var(--color-primary)] hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          {t("openPdf")}
        </a>
      ) : null}

      {detail.status === "Revoked" && detail.revocationReason ? (
        <p className="rounded-xl border border-[var(--color-accent-critical)]/40 bg-[color-mix(in_srgb,var(--color-accent-critical)_8%,transparent)] p-3 text-sm text-[var(--color-accent-critical)]">
          {t("revokedReason", { reason: detail.revocationReason })}
        </p>
      ) : null}
    </Card>
  );
}

function VerificationBanner({
  verification,
}: {
  verification: VerificationState;
}) {
  const t = useTranslations("certificateDetail.verify");

  if (verification.state === "idle") return null;

  const variants = {
    checking: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      tone: "border-[var(--color-border-strong)] text-[var(--color-fg-muted)]",
      text: t("checking"),
    },
    match: {
      icon: <ShieldCheck className="h-4 w-4" />,
      tone: "border-[var(--color-accent-ok)]/40 bg-[color-mix(in_srgb,var(--color-accent-ok)_8%,transparent)] text-[var(--color-accent-ok)]",
      text: t("match"),
    },
    mismatch: {
      icon: <ShieldAlert className="h-4 w-4" />,
      tone: "border-[var(--color-accent-critical)]/40 bg-[color-mix(in_srgb,var(--color-accent-critical)_8%,transparent)] text-[var(--color-accent-critical)]",
      text: t("mismatch"),
    },
    error: {
      icon: <ShieldQuestion className="h-4 w-4" />,
      tone: "border-[var(--color-accent-warn)]/40 bg-[color-mix(in_srgb,var(--color-accent-warn)_8%,transparent)] text-[var(--color-accent-warn)]",
      text: t("error"),
    },
  } as const;

  const v = variants[verification.state];

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium ${v.tone}`}
    >
      {v.icon}
      <span>{v.text}</span>
    </div>
  );
}
