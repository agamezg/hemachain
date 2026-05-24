"use client";

import { useCallback, useEffect, useState } from "react";
import { useContract } from "@/hooks/useContract";
import {
  certStatusOf,
  certTypeById,
  type CertStatusKey,
  type CertTypeKey,
} from "@/lib/cert";
import { hashFileKeccak, resolveStorageUrl } from "@/lib/ipfs";

export interface CertificateDetail {
  tokenId: bigint;
  owner: string;
  certTypeKey: CertTypeKey;
  issuer: string;
  issuedAt: bigint;
  expiresAt: bigint;
  documentHash: string;
  ipfsCID: string;
  status: CertStatusKey;
  revocationReason: string;
}

/**
 * Hash-verification lifecycle: fetch the PDF from its storage URL, recompute
 * keccak256, and compare against the on-chain `documentHash`. A `match` proves
 * the rendered PDF is exactly what the issuer committed to (SDD §10.1).
 */
export type VerificationState =
  | { state: "idle" }
  | { state: "checking"; pdfUrl: string }
  | { state: "match"; pdfUrl: string; computedHash: string }
  | { state: "mismatch"; pdfUrl: string; computedHash: string }
  | { state: "error"; pdfUrl: string; error: string };

type RawMetadata = readonly [
  bigint,
  string,
  bigint,
  bigint,
  string,
  string,
  boolean,
  string,
];

export function useCertificateDetail(tokenId: bigint | null) {
  const cert = useContract("HemaCertificate");
  const [data, setData] = useState<CertificateDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationState>({
    state: "idle",
  });
  const isLoading = data === null && error === null && tokenId !== null;

  const load = useCallback(async () => {
    if (!cert || tokenId === null) return;
    try {
      const m = (await cert.metadataOf(tokenId)) as RawMetadata;
      const owner = (await cert.ownerOf(tokenId)) as string;
      const status = certStatusOf(await cert.statusOf(tokenId));
      const detail: CertificateDetail = {
        tokenId,
        owner,
        certTypeKey: certTypeById(m[0]),
        issuer: m[1],
        issuedAt: m[2],
        expiresAt: m[3],
        documentHash: m[4],
        ipfsCID: m[5],
        status,
        revocationReason: m[7],
      };
      setData(detail);
      setError(null);
      return detail;
    } catch {
      // metadataOf reverts TokenNotFound for unminted ids.
      setData(null);
      setError("not_found");
      return null;
    }
  }, [cert, tokenId]);

  useEffect(() => {
    if (!cert || tokenId === null) return;
    let cancelled = false;

    void (async () => {
      const detail = await load();
      if (cancelled || !detail) return;

      const pdfUrl = resolveStorageUrl(detail.ipfsCID);
      setVerification({ state: "checking", pdfUrl });
      try {
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const computedHash = await hashFileKeccak(blob);
        if (cancelled) return;
        const ok =
          computedHash.toLowerCase() === detail.documentHash.toLowerCase();
        setVerification({
          state: ok ? "match" : "mismatch",
          pdfUrl,
          computedHash,
        });
      } catch (err) {
        if (!cancelled) {
          setVerification({ state: "error", pdfUrl, error: (err as Error).message });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cert, tokenId, load]);

  return { data, isLoading, error, verification, refresh: load };
}
