"use client";

import type { Contract, EventLog } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useContract } from "@/hooks/useContract";
import { certStatusOf, certTypeById, type CertStatusKey, type CertTypeKey } from "@/lib/cert";

export interface CertificateView {
  tokenId: bigint;
  subject: string; // address the NFT was minted to (event arg)
  certTypeKey: CertTypeKey;
  issuer: string;
  issuedAt: bigint;
  expiresAt: bigint;
  documentHash: string;
  ipfsCID: string;
  status: CertStatusKey;
  revocationReason: string;
}

interface UseCertificatesOptions {
  /** Filter to certificates issued by this address. */
  issuer?: string;
  /** Filter to certificates whose subject is this address. */
  subject?: string;
}

type RawMetadata = readonly [
  bigint, // certType
  string, // issuer
  bigint, // issuedAt
  bigint, // expiresAt
  string, // documentHash
  string, // ipfsCID
  boolean, // revoked
  string, // revocationReason
];

async function loadCertificates(
  cert: Contract,
  opts: UseCertificatesOptions,
): Promise<CertificateView[]> {
  // tokenId, subject, issuer are the indexed CertificateIssued params.
  const filter = cert.filters.CertificateIssued(
    undefined,
    opts.subject ?? undefined,
    opts.issuer ?? undefined,
  );
  const events = (await cert.queryFilter(filter)) as EventLog[];

  const list = await Promise.all(
    events.map(async (ev) => {
      const tokenId = ev.args[0] as bigint;
      const subject = ev.args[1] as string;
      const m = (await cert.metadataOf(tokenId)) as RawMetadata;
      const status = certStatusOf(await cert.statusOf(tokenId));
      return {
        tokenId,
        subject,
        certTypeKey: certTypeById(m[0]),
        issuer: m[1],
        issuedAt: m[2],
        expiresAt: m[3],
        documentHash: m[4],
        ipfsCID: m[5],
        status,
        revocationReason: m[7],
      } satisfies CertificateView;
    }),
  );

  return list.sort((a, b) => Number(b.tokenId - a.tokenId));
}

export function useCertificates(opts: UseCertificatesOptions = {}) {
  const cert = useContract("HemaCertificate");
  const [certificates, setCertificates] = useState<CertificateView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issuer = opts.issuer?.toLowerCase() ?? "";
  const subject = opts.subject?.toLowerCase() ?? "";

  const refresh = useCallback(async () => {
    if (!cert) return;
    setIsLoading(true);
    setError(null);
    try {
      const next = await loadCertificates(cert, {
        issuer: issuer || undefined,
        subject: subject || undefined,
      });
      setCertificates(next);
    } catch (err) {
      setError((err as Error).message);
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  }, [cert, issuer, subject]);

  useEffect(() => {
    if (!cert) return;
    let cancelled = false;
    void (async () => {
      try {
        const next = await loadCertificates(cert, {
          issuer: issuer || undefined,
          subject: subject || undefined,
        });
        if (!cancelled) setCertificates(next);
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setCertificates([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cert, issuer, subject]);

  return { certificates, isLoading, error, refresh };
}
