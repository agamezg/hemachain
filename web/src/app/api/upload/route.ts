import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// fs + crypto require the Node.js runtime (not Edge).
export const runtime = "nodejs";

const PINATA_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_GATEWAY = "https://gateway.pinata.cloud";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — certificates are small PDFs.

/**
 * POST /api/upload — pin a certificate PDF and return a storable reference.
 *
 * Dual mode (SDD §10.1): pins to Pinata when `PINATA_JWT` is configured,
 * otherwise writes to `public/cert-uploads/` so the demo runs without an
 * external account. The keccak256 commitment is computed client-side from the
 * same bytes, so the on-chain proof is independent of which mode ran.
 */
export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing 'file' field" }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File exceeds 10 MB" }, { status: 413 });
  }
  if (file.type && file.type !== "application/pdf") {
    return Response.json(
      { error: "Only application/pdf is accepted" },
      { status: 415 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const jwt = process.env.PINATA_JWT;

  if (jwt) {
    try {
      const cid = await pinToPinata(
        arrayBuffer,
        file.name || "certificate.pdf",
        jwt,
      );
      return Response.json({
        cid,
        mode: "pinata",
        url: `${PINATA_GATEWAY}/ipfs/${cid}`,
      });
    } catch (err) {
      return Response.json(
        { error: `Pinata upload failed: ${(err as Error).message}` },
        { status: 502 },
      );
    }
  }

  // Local dev fallback — content-addressed filename keeps it deterministic.
  const bytes = Buffer.from(arrayBuffer);
  const sha = createHash("sha256").update(bytes).digest("hex");
  const fileName = `${sha}.pdf`;
  const dir = path.join(process.cwd(), "public", "cert-uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), bytes);

  return Response.json({
    cid: `local:${fileName}`,
    mode: "local",
    url: `/cert-uploads/${fileName}`,
  });
}

async function pinToPinata(
  arrayBuffer: ArrayBuffer,
  name: string,
  jwt: string,
): Promise<string> {
  const body = new FormData();
  body.append(
    "file",
    new Blob([arrayBuffer], { type: "application/pdf" }),
    name,
  );
  body.append("pinataMetadata", JSON.stringify({ name }));

  const res = await fetch(PINATA_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body,
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text().catch(() => "")}`.trim());
  }
  const json = (await res.json()) as { IpfsHash?: string };
  if (!json.IpfsHash) {
    throw new Error("response missing IpfsHash");
  }
  return json.IpfsHash;
}
