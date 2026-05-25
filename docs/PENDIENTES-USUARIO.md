# Pendientes del usuario — claves, cuentas y tareas manuales

> Lo que **vos** tenés que aportar para desbloquear funcionalidad completa. El proyecto está diseñado para **correr sin ninguna de estas claves** (modos de fallback), así que nada de esto bloquea el desarrollo — sólo habilita el camino "real" de cada feature.
>
> **Seguridad:** todas las claves van en archivos **gitignored** (`web/.env.local`, `sc/.env`). Nunca se commitean. El código nunca loguea secretos. Copiá `web/.env.example` → `web/.env.local` y completá sólo lo que necesites.

---

## Resumen rápido

| Clave / cuenta | Para qué | ¿Sin ella? | Dónde va | Fase |
|---|---|---|---|---|
| `ANTHROPIC_API_KEY` | Agente "Ask HemaChain" (Claude tool-use) | Modo dual: responde con un hint de configuración | `web/.env.local` | 7 (Capa D) |
| `PINATA_JWT` | Subir PDFs de certificados a IPFS real | Modo local: guarda en `public/cert-uploads/` (la demo funciona) | `web/.env.local` | 5 ✅ |
| `NEXT_PUBLIC_IPFS_GATEWAY` | Gateway para releer PDFs pineados | Usa el gateway público de Pinata por defecto | `web/.env.local` | 5 ✅ |
| `SEPOLIA_RPC_URL` | Deploy + lectura en testnet pública | Todo corre en Anvil local | entorno / `sc/.env` | 8 |
| `DEPLOYER_PRIVATE_KEY` | Firmar el deploy a Sepolia | No se puede deployar a testnet | entorno / `sc/.env` | 8 |
| Sepolia ETH (faucet) | Gas del deploy a Sepolia | — | wallet del deployer | 8 |
| `ETHERSCAN_API_KEY` | Verificar contratos en Etherscan | Contratos sin código fuente verificado | entorno / `sc/.env` | 8 |

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

> Estas tres se usan juntas cuando publiquemos los contratos en la testnet. El wiring en `sc/foundry.toml` (`[rpc_endpoints]` + `[etherscan]`) lo agrego yo en Phase 8; vos sólo aportás los valores.

- **`SEPOLIA_RPC_URL`** — endpoint RPC de Sepolia. Gratis en [Alchemy](https://alchemy.com/) o [Infura](https://infura.io/) (crear una app → copiar la URL HTTPS). También va al frontend como `NEXT_PUBLIC_SEPOLIA_RPC_URL` si querés que la dApp lea de Sepolia.
- **`DEPLOYER_PRIVATE_KEY`** — clave privada de una wallet **dedicada al deploy** (no tu wallet personal). **Nunca se commitea.**
- **Sepolia ETH** — gas para el deploy. Pedir en un faucet (p. ej. [sepoliafaucet.com](https://sepoliafaucet.com/), Alchemy/Google faucet) a la dirección del deployer.
- **`ETHERSCAN_API_KEY`** — para verificar el código fuente. [etherscan.io](https://etherscan.io/) → *API Keys*.
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
