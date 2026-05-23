import { keccak256, toUtf8Bytes } from "ethers";

/**
 * Producción debería incluir un salt institucional secreto que vive off-chain
 * (Ley 25.326 / SDD §11.4). Para la demo del TFM hasheamos el DNI directo —
 * la UI lo aclara explícitamente.
 */
export function hashDonorId(dni: string): `0x${string}` {
  return keccak256(toUtf8Bytes(dni.trim())) as `0x${string}`;
}

export function hashPatientId(patientRef: string): `0x${string}` {
  return keccak256(toUtf8Bytes(patientRef.trim())) as `0x${string}`;
}
