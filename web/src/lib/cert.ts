/** CertType enum from HemaCertificate.CertType (AAHITC=0 … OTHER=4). */
export const CERT_TYPES = [
  { id: 0, key: "AAHITC" as const },
  { id: 1, key: "ISO15189" as const },
  { id: 2, key: "ANMAT" as const },
  { id: 3, key: "GMP" as const },
  { id: 4, key: "OTHER" as const },
];

export type CertTypeKey = (typeof CERT_TYPES)[number]["key"];

export function certTypeById(id: number | bigint): CertTypeKey {
  const n = typeof id === "bigint" ? Number(id) : id;
  return CERT_TYPES.find((c) => c.id === n)?.key ?? "OTHER";
}

/** CertStatus enum from HemaCertificate.CertStatus. */
export const CERT_STATUS = ["Valid", "Expired", "Revoked"] as const;

export type CertStatusKey = (typeof CERT_STATUS)[number];

export function certStatusOf(idx: number | bigint): CertStatusKey {
  const i = typeof idx === "bigint" ? Number(idx) : idx;
  return CERT_STATUS[i] ?? "Valid";
}

/** Badge tone per certificate status — green/amber/red. */
export function certStatusTone(
  status: CertStatusKey,
): "ok" | "warn" | "critical" {
  if (status === "Valid") return "ok";
  if (status === "Expired") return "warn";
  return "critical";
}
