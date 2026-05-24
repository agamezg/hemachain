import { keccak256 } from "ethers";

/**
 * Storage layer for certificate PDFs (SDD §10.1). Certificates commit two
 * things on-chain: `documentHash = keccak256(PDF)` and an `ipfsCID` pointer.
 *
 * The upload route (`/api/upload`) runs in dual mode:
 * - **pinata** — when `PINATA_JWT` is set, the PDF is pinned to IPFS and the
 *   real CID is returned (`bafy…` / `Qm…`).
 * - **local**  — otherwise the PDF is written under `public/cert-uploads/` and
 *   a `local:<name>` reference is returned so the demo works offline.
 *
 * The hash-verification flow is identical in both modes: it only depends on the
 * bytes, not on where they live.
 */

const LOCAL_PREFIX = "local:";
const IPFS_SCHEME = "ipfs://";

/** Public IPFS gateway used to fetch pinned PDFs back for hash verification. */
export const IPFS_GATEWAY = (
  process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://gateway.pinata.cloud"
).replace(/\/+$/, "");

export type UploadMode = "pinata" | "local";

export interface UploadResult {
  /** Value to store on-chain as `ipfsCID` (bare CID, or `local:<name>`). */
  cid: string;
  mode: UploadMode;
  /** Already-resolved, fetchable URL for the uploaded PDF. */
  url: string;
}

/** Strip a leading `ipfs://` scheme if present. */
function bareCid(ipfsCID: string): string {
  return ipfsCID.startsWith(IPFS_SCHEME)
    ? ipfsCID.slice(IPFS_SCHEME.length)
    : ipfsCID;
}

export function isLocalRef(ipfsCID: string): boolean {
  return bareCid(ipfsCID).startsWith(LOCAL_PREFIX);
}

/**
 * Resolve an on-chain `ipfsCID` to a fetchable URL.
 * - real CID         → `${gateway}/ipfs/<cid>`
 * - `local:<name>`   → `/cert-uploads/<name>` (same-origin)
 */
export function resolveStorageUrl(ipfsCID: string): string {
  const cid = bareCid(ipfsCID);
  if (cid.startsWith(LOCAL_PREFIX)) {
    return `/cert-uploads/${cid.slice(LOCAL_PREFIX.length)}`;
  }
  return `${IPFS_GATEWAY}/ipfs/${cid}`;
}

/** keccak256 of a blob's raw bytes — matches the on-chain `documentHash`. */
export async function hashFileKeccak(file: Blob): Promise<`0x${string}`> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return keccak256(bytes) as `0x${string}`;
}

/** Client helper: POST a PDF to `/api/upload` and get back a storable CID. */
export async function uploadCertificatePdf(file: File): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body });
  if (!res.ok) {
    let detail = "";
    try {
      detail = ((await res.json()) as { error?: string }).error ?? "";
    } catch {
      // non-JSON error body
    }
    throw new Error(detail || `Upload failed (HTTP ${res.status})`);
  }
  return (await res.json()) as UploadResult;
}
