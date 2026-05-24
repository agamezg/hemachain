"use client";

import Link from "next/link";
import { Award, FileText, Ban, ExternalLink } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InputField } from "@/components/ui/InputField";
import { useCertificates } from "@/hooks/useCertificates";
import { useContract } from "@/hooks/useContract";
import { useTransaction } from "@/hooks/useTransaction";
import { useWallet } from "@/hooks/useWallet";
import { CERT_TYPES, certStatusTone, type CertTypeKey } from "@/lib/cert";
import { shortAddress } from "@/lib/eth";
import { hashFileKeccak, uploadCertificatePdf } from "@/lib/ipfs";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

interface IssueErrors {
  subject?: string;
  certType?: string;
  expiry?: string;
  file?: string;
}

export function CertificadorPanel() {
  const t = useTranslations("certificador");
  const tType = useTranslations("certType");
  const tStatus = useTranslations("certStatus");
  const locale = useLocale();
  const { account } = useWallet();
  const cert = useContract("HemaCertificate", { withSigner: true });
  const { run, isPending } = useTransaction();
  const today = useState(() => new Date().toISOString().slice(0, 10))[0];

  const issued = useCertificates({ issuer: account ?? undefined });

  const [subject, setSubject] = useState("");
  const [certTypeId, setCertTypeId] = useState("0");
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<`0x${string}` | "">("");
  const [errors, setErrors] = useState<IssueErrors>({});
  const [uploading, setUploading] = useState(false);

  const [revoking, setRevoking] = useState<bigint | null>(null);
  const [reason, setReason] = useState("");

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setFileHash(picked ? await hashFileKeccak(picked) : "");
  }

  async function onIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: IssueErrors = {};
    if (!ADDRESS_RE.test(subject.trim())) next.subject = t("issue.errors.subject");
    if (!file) next.file = t("issue.errors.file");
    const expiresAt = expiry
      ? Math.floor(new Date(`${expiry}T23:59:59`).getTime() / 1000)
      : 0;
    if (!expiresAt || expiresAt * 1000 <= Date.now()) {
      next.expiry = t("issue.errors.expiry");
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || !cert || !file) return;

    setUploading(true);
    let cid: string;
    let mode: "pinata" | "local";
    let documentHash: `0x${string}`;
    try {
      const upload = await uploadCertificatePdf(file);
      cid = upload.cid;
      mode = upload.mode;
      documentHash = fileHash || (await hashFileKeccak(file));
    } catch (err) {
      toast.error(`${t("issue.toast.error")}: ${(err as Error).message}`);
      setUploading(false);
      return;
    }
    setUploading(false);

    const receipt = await run(
      () =>
        cert.issueCertificate(
          subject.trim(),
          Number(certTypeId),
          BigInt(expiresAt),
          documentHash,
          cid,
        ),
      {
        messages: {
          pending: t("issue.toast.pending"),
          success: t("issue.toast.success"),
          errorPrefix: t("issue.toast.error"),
        },
      },
    );
    if (receipt) {
      toast.message(mode === "pinata" ? t("issue.modePinata") : t("issue.modeLocal"));
      setSubject("");
      setCertTypeId("0");
      setExpiry("");
      setFile(null);
      setFileHash("");
      await issued.refresh();
    }
  }

  async function onRevoke(tokenId: bigint) {
    if (!cert || reason.trim().length < 3) return;
    const receipt = await run(() => cert.revokeCertificate(tokenId, reason.trim()), {
      messages: {
        pending: t("revoke.toast.pending"),
        success: t("revoke.toast.success"),
        errorPrefix: t("revoke.toast.error"),
      },
    });
    if (receipt) {
      setRevoking(null);
      setReason("");
      await issued.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onIssue} className="contents">
        <Card className="flex flex-col gap-4">
          <CardHeader>
            <CardTitle>{t("issue.title")}</CardTitle>
            <CardDescription>{t("issue.subtitle")}</CardDescription>
          </CardHeader>

          <InputField
            label={t("issue.subject")}
            placeholder="0x…"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            error={errors.subject}
            hint={t("issue.subjectHint")}
            className="font-mono"
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cert-type"
              className="text-sm font-medium text-[var(--color-fg)]"
            >
              {t("issue.certType")}
            </label>
            <select
              id="cert-type"
              value={certTypeId}
              onChange={(e) => setCertTypeId(e.target.value)}
              className="h-11 rounded-[var(--radius-input)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3.5 text-sm"
            >
              {CERT_TYPES.map((c) => (
                <option key={c.key} value={c.id.toString()}>
                  {tType(c.key as CertTypeKey)}
                </option>
              ))}
            </select>
          </div>

          <InputField
            type="date"
            label={t("issue.expiry")}
            value={expiry}
            min={today}
            onChange={(e) => setExpiry(e.target.value)}
            error={errors.expiry}
            hint={t("issue.expiryHint")}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cert-file"
              className="text-sm font-medium text-[var(--color-fg)]"
            >
              {t("issue.file")}
            </label>
            <input
              id="cert-file"
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              className="text-sm text-[var(--color-fg-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-bg-elevated)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--color-fg)] hover:file:bg-[var(--color-border)]"
            />
            <p className="text-xs text-[var(--color-fg-muted)]">
              {t("issue.fileHint")}
            </p>
            {errors.file ? (
              <p className="text-xs text-[var(--color-accent-critical)]">
                {errors.file}
              </p>
            ) : null}
          </div>

          {fileHash ? (
            <div className="rounded-xl bg-[var(--color-bg)] p-3 text-xs">
              <span className="text-[var(--color-fg-muted)]">
                {t("issue.hashPreview")}:{" "}
              </span>
              <span className="font-mono break-all">{fileHash}</span>
            </div>
          ) : null}

          <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
            <Button type="submit" loading={isPending || uploading} disabled={!cert}>
              <Award className="h-4 w-4" />
              {uploading ? t("issue.uploading") : t("issue.submit")}
            </Button>
          </div>
        </Card>
      </form>

      <Card className="flex flex-col gap-4">
        <CardHeader>
          <CardTitle>{t("list.title")}</CardTitle>
          <CardDescription>{t("list.subtitle")}</CardDescription>
        </CardHeader>

        {issued.certificates.length === 0 ? (
          <p className="text-sm text-[var(--color-fg-muted)]">{t("list.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {issued.certificates.map((c) => (
              <li
                key={c.tokenId.toString()}
                className="rounded-2xl border border-[var(--color-border)] p-3 flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-mono text-[var(--color-fg-muted)]">
                      #{c.tokenId.toString()}
                    </span>
                    <Badge tone="primary">{tType(c.certTypeKey)}</Badge>
                    <Badge tone={certStatusTone(c.status)}>
                      {tStatus(c.status)}
                    </Badge>
                    <span className="text-[var(--color-fg-muted)]">
                      {t("list.subject")}: {shortAddress(c.subject)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${locale}/certificates/${c.tokenId.toString()}`}
                      className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t("list.view")}
                    </Link>
                    {c.status === "Valid" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => {
                          setRevoking(c.tokenId);
                          setReason("");
                        }}
                      >
                        <Ban className="h-4 w-4" />
                        {t("revoke.cta")}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <p className="text-xs text-[var(--color-fg-muted)]">
                  {t("list.expiresAt")}:{" "}
                  {new Date(Number(c.expiresAt) * 1000).toLocaleDateString()}
                </p>

                {revoking === c.tokenId ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-[var(--color-accent-critical)]/40 p-3">
                    <InputField
                      label={t("revoke.reason")}
                      placeholder={t("revoke.reasonPlaceholder")}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setRevoking(null)}
                      >
                        {t("revoke.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        loading={isPending}
                        disabled={reason.trim().length < 3}
                        onClick={() => void onRevoke(c.tokenId)}
                      >
                        <Ban className="h-4 w-4" />
                        {t("revoke.confirm")}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {c.status === "Revoked" && c.revocationReason ? (
                  <p className="flex items-center gap-1.5 text-xs text-[var(--color-accent-critical)]">
                    <FileText className="h-3.5 w-3.5" />
                    {c.revocationReason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
