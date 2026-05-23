export const ABO_RH_VALUES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;

export type AboRhCode = (typeof ABO_RH_VALUES)[number];

/** ABO/Rh code packed in bytes8 — matches `Codes.ABO_*` literals. */
export function aboRhToBytes8(code: AboRhCode): `0x${string}` {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(code);
  if (bytes.length > 8) {
    throw new Error(`ABO code "${code}" > 8 bytes`);
  }
  const padded = new Uint8Array(8);
  padded.set(bytes, 0);
  return ("0x" +
    Array.from(padded)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")) as `0x${string}`;
}

export function bytes8ToAboRh(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = clean
    .match(/.{1,2}/g)!
    .map((h) => parseInt(h, 16))
    .filter((b) => b !== 0);
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Enum order matches Codes.ComponentType (Unknown=0, RBC=1, FFP=2, PLT=3, CRYO=4). */
export const COMPONENT_TYPES = [
  { id: 1, key: "RBC" as const, days: 42, tempMin: 2, tempMax: 6 },
  { id: 2, key: "FFP" as const, days: 365, tempMin: -30, tempMax: -18 },
  { id: 3, key: "PLT" as const, days: 5, tempMin: 20, tempMax: 24 },
  { id: 4, key: "CRYO" as const, days: 365, tempMin: -30, tempMax: -18 },
];

export type ComponentTypeKey = (typeof COMPONENT_TYPES)[number]["key"];

export function componentTypeById(id: number | bigint) {
  const numeric = typeof id === "bigint" ? Number(id) : id;
  return COMPONENT_TYPES.find((c) => c.id === numeric);
}

/** Unit status enum from HemaTraceability.UnitStatus. */
export const UNIT_STATUS = [
  "None",
  "Collected",
  "UnderTest",
  "Quarantined",
  "Released",
  "Processed",
  "Recalled",
] as const;

export type UnitStatusKey = (typeof UNIT_STATUS)[number];

export function unitStatusOf(idx: number | bigint): UnitStatusKey {
  const i = typeof idx === "bigint" ? Number(idx) : idx;
  return UNIT_STATUS[i] ?? "None";
}

/** ReleaseStatus enum. */
export const RELEASE_STATUS = ["Pending", "Released", "Quarantined"] as const;

/** AdverseKind enum. */
export const ADVERSE_KIND = [
  "DonorPositive",
  "RecipientReaction",
  "EquipmentFailure",
] as const;
