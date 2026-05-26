# Pendientes del usuario — claves, cuentas y tareas manuales

> Lo que **vos** tenés que aportar para desbloquear funcionalidad completa. El proyecto está diseñado para **correr sin ninguna de estas claves** (modos de fallback), así que nada de esto bloquea el desarrollo — sólo habilita el camino "real" de cada feature.
>
> **Seguridad:** todas las claves van en archivos **gitignored** (`web/.env.local`, `sc/.env`). Nunca se commitean. El código nunca loguea secretos. Copiá `web/.env.example` → `web/.env.local` y completá sólo lo que necesites.

---

## ⏸️ Dónde quedamos — sesión 2026-05-26 (retomar acá mañana)

**Hecho y verificado hoy (ya está en `sc/.env`, que es gitignored):**
- ✅ `SEPOLIA_RPC_URL` — Alchemy, endpoint **Ethereum Sepolia** (chain id 11155111, verificado en vivo). *No* usar las URLs de "World Chain".
- ✅ `DEPLOYER_PRIVATE_KEY` — wallet dedicada, dirección pública `0xa49aA91a06a58c9D29Ac1314626aD51314004947`.
- ✅ `ETHERSCAN_API_KEY` — cargada (34 chars).
- ✅ Wiring del deploy en `sc/foundry.toml` (`[rpc_endpoints]` + `[etherscan]`) y `sc/.env.example` — turnkey.
- ✅ Traducciones i18n `pt`/`en` completas → la demo multilingüe ya es mostrable en cámara.

**Único pendiente técnico para el deploy: falta gas.**
- El deployer tiene **0.05 Sepolia ETH**.
- A ~20 gwei (base fee de hoy) el deploy de los 3 contratos cuesta **~0.16 ETH** (≈8M gas); incluso el contrato más grande solo (~3.6M gas) ya supera los 0.05.
- Para deployar hace falta **una** de estas dos:
  1. **Subir el saldo a ~0.2 Sepolia ETH** — el faucet PoW `sepolia-faucet.pk910.de` da más por sesión que los de 0.05/día; o
  2. **Esperar a que el base fee de Sepolia baje a ≤ ~5 gwei** (fluctúa; off-peak suele estar 1–3 gwei) y deployar con los 0.05 actuales.

**Próximo paso (mañana):** cuando tengas fondos suficientes o gas barato, decime **"topped up"** o **"check gas"** y corro el deploy:
```bash
cd sc && forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
```
> Nota: la línea `DEPLOYER_PRIVATE_KEY` en tu `.env` tiene espacios alrededor del `=`, lo que rompe `source` (por eso el primer intento usó la cuenta Anvil por defecto). Yo extraigo la clave directo del archivo, así que funciona igual; pero si querés que el one-liner documentado ande, dejala como `DEPLOYER_PRIVATE_KEY=0x...` (sin espacios).

Tras deployar: copio las 3 direcciones al **README §6** (con links de Etherscan) y a **`web/.env.local`** (`NEXT_PUBLIC_*_ADDRESS_SEPOLIA`).

> Recordá: Sepolia es el **bonus de credibilidad**. La demo en vivo corre sobre Anvil + seed; nada de esto bloquea grabar el video.

---

## Resumen rápido

| Clave / cuenta | Para qué | ¿Sin ella? | Dónde va | Fase |
|---|---|---|---|---|
| ⏳ `ANTHROPIC_API_KEY` | Agente "Ask HemaChain" (Claude tool-use) | Modo dual: responde con un hint de configuración | `web/.env.local` | 7 (Capa D) — opcional para mostrar el agente en vivo en el video |
| `PINATA_JWT` | Subir PDFs de certificados a IPFS real | Modo local: guarda en `public/cert-uploads/` (la demo funciona) | `web/.env.local` | 5 ✅ |
| `NEXT_PUBLIC_IPFS_GATEWAY` | Gateway para releer PDFs pineados | Usa el gateway público de Pinata por defecto | `web/.env.local` | 5 ✅ |
| ✅ `SEPOLIA_RPC_URL` | Deploy + lectura en testnet pública | Todo corre en Anvil local | `sc/.env` ✅ | 8 |
| ✅ `DEPLOYER_PRIVATE_KEY` | Firmar el deploy a Sepolia | No se puede deployar a testnet | `sc/.env` ✅ (`0xa49a…4947`) | 8 |
| ⏳ Sepolia ETH (faucet) | Gas del deploy a Sepolia | — | wallet del deployer — **0.05 ETH; falta ~0.2** | 8 |
| ✅ `ETHERSCAN_API_KEY` | Verificar contratos en Etherscan | Contratos sin código fuente verificado | `sc/.env` ✅ | 8 |

---

## 1. `ANTHROPIC_API_KEY` — agente "Ask HemaChain" (Phase 7, Capa D)

- **Para qué:** el panel flotante "Ask HemaChain" que responde consultas de trazabilidad en lenguaje natural (Claude `claude-opus-4-7` con tool-use sobre lecturas on-chain).
- **Sin ella:** el endpoint `/api/ask` corre en **modo dual** y devuelve un mensaje pidiendo configurar la clave — no rompe el build ni la demo.
- **Cómo obtenerla:** [console.anthropic.com](https://console.anthropic.com/) → *API Keys* → *Create Key*.
- **Dónde:** `web/.env.local`:
  ```bash
  ANTHROPIC_API_KEY=sk-ant-...
  ```
- **Nota:** es server-side (la usa la route handler, nunca el navegador). No lleva prefijo `NEXT_PUBLIC_`.

## 2. `PINATA_JWT` — IPFS real para certificados (Phase 5, ya implementado)

- **Para qué:** anclar los PDFs de certificados en IPFS y obtener un CID real (`bafy…`/`Qm…`) resoluble en cualquier gateway.
- **Sin ella:** `/api/upload` escribe el PDF en `web/public/cert-uploads/` (content-addressed). La verificación de hash funciona igual; sólo no es IPFS "de verdad".
- **Cómo obtenerla:** [pinata.cloud](https://pinata.cloud/) (cuenta gratuita) → *API Keys* → crear una key con permiso de pinning → copiar el **JWT**.
- **Dónde:** `web/.env.local`:
  ```bash
  PINATA_JWT=eyJ...
  # opcional, si usás un gateway dedicado:
  NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud
  ```

## 3. Bundle de deploy a Sepolia (Phase 8)

> Estas tres se usan juntas para publicar los contratos en la testnet. ✅ El wiring en `sc/foundry.toml` (`[rpc_endpoints]` + `[etherscan]`) **ya está hecho**; las tres claves ya están cargadas en `sc/.env`. **Sólo falta gas suficiente** (ver el bloque "Dónde quedamos" arriba).

- ✅ **`SEPOLIA_RPC_URL`** — cargada (Alchemy, endpoint **Ethereum Sepolia**, chain 11155111). Tras el deploy también iría al frontend como `NEXT_PUBLIC_SEPOLIA_RPC_URL` si querés que la dApp lea de Sepolia.
- ✅ **`DEPLOYER_PRIVATE_KEY`** — cargada. Wallet dedicada `0xa49aA91a06a58c9D29Ac1314626aD51314004947`. **Nunca se commitea.** *(Sacar los espacios alrededor del `=` si querés usar el one-liner documentado con `source`.)*
- ⏳ **Sepolia ETH** — gas para el deploy. **Tiene 0.05; el deploy necesita ~0.16–0.2 a gas actual.** Top-up vía faucet PoW [`sepolia-faucet.pk910.de`](https://sepolia-faucet.pk910.de/) (da más por sesión), o esperar a que el base fee de Sepolia baje a ≤ ~5 gwei.
- ✅ **`ETHERSCAN_API_KEY`** — cargada. Sirve para `--verify` en el mismo deploy.
- **Dónde (deploy):** exportadas en el entorno o en `sc/.env` (gitignored):
  ```bash
  SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
  DEPLOYER_PRIVATE_KEY=0x...
  ETHERSCAN_API_KEY=...
  ```
- **Dónde (frontend, tras el deploy):** `web/.env.local`:
  ```bash
  NEXT_PUBLIC_CHAIN_ID=11155111
  NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/...
  NEXT_PUBLIC_REGISTRY_ADDRESS_SEPOLIA=0x...      # los completo tras deployar
  NEXT_PUBLIC_TRACEABILITY_ADDRESS_SEPOLIA=0x...
  NEXT_PUBLIC_CERTIFICATE_ADDRESS_SEPOLIA=0x...
  ```

---

## Tareas manuales no-secreto (Phase 8 — las hacés vos)

No son claves, pero también dependen de vos para cerrar la entrega:

- [ ] **Grabar el video Loom** (≤ 5 min, español) y poner el enlace en el README §10 con permiso "Anyone with link".
- [ ] **Tomar las 7 capturas de pantalla** para `screenshots/` (la lista está en el README §8).
- [ ] **Confirmar** que el repo GitHub está público y que GitLab (academia) quedó sincronizado.
- [ ] (Opcional) Datos de las instituciones reales del mapa, si querés reemplazar las coordenadas demo de `web/src/config/facilities.ts`.

---

## Cosas que **NO** necesitás aportar

- **Para todo el desarrollo y la demo local:** nada. Anvil + el seed + los modos de fallback (IPFS local, agente en modo hint) cubren el ciclo completo end-to-end sin una sola clave externa.
