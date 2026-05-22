import { id } from "ethers";

export type RoleKey =
  | "ADMIN"
  | "BANCO_SANGRE"
  | "LABORATORIO"
  | "FRACCIONAMIENTO"
  | "MEDICINA_TRANSFUSIONAL"
  | "AUDITOR"
  | "CERTIFICADOR";

export const ROLE_HASH: Record<RoleKey, `0x${string}`> = {
  ADMIN:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  BANCO_SANGRE: id("BANCO_SANGRE") as `0x${string}`,
  LABORATORIO: id("LABORATORIO") as `0x${string}`,
  FRACCIONAMIENTO: id("FRACCIONAMIENTO") as `0x${string}`,
  MEDICINA_TRANSFUSIONAL: id("MEDICINA_TRANSFUSIONAL") as `0x${string}`,
  AUDITOR: id("AUDITOR") as `0x${string}`,
  CERTIFICADOR: id("CERTIFICADOR") as `0x${string}`,
};

export const ZERO_ROLE = ROLE_HASH.ADMIN;

export function roleKeyFromHash(hash: string): RoleKey | "NONE" {
  const normalised = hash.toLowerCase();
  for (const [key, h] of Object.entries(ROLE_HASH)) {
    if (h.toLowerCase() === normalised) return key as RoleKey;
  }
  if (normalised === ZERO_ROLE) return "NONE";
  return "NONE";
}
