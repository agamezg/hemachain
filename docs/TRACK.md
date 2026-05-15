# HemaChain — TRACK.md

> Tracker operativo de fases y tareas. Cada vez que volvemos al proyecto, este archivo dice exactamente dónde estamos.
> El plan completo y la justificación de cada decisión están en [`SDD.md`](./SDD.md) y en el plan original `~/.claude/plans/imperative-juggling-candy.md`.
>
> **Convenciones:**
> - `[x]` tarea completada
> - `[ ]` tarea pendiente
> - `[~]` tarea en progreso (no terminada — actualizar al retomar)
> - **★** tarea crítica (bloquea la fase)
>
> **Última actualización:** Phase 0 completa — todos los scaffolds, scripts y hooks en su lugar; ambos remotes (`origin`/GitHub + `gitlab`/academia) sincronizados.

---

## Resumen ejecutivo del estado

| Fase | Estado | DoD alcanzada |
|---|---|:-:|
| 0 — Setup, SDD, scaffolding | ✅ Completa | Sí (`forge build` y `npm run build` verdes; documentación inicial escrita; ambos remotes pusheados) |
| 1 — Smart contracts | ⬜ No iniciada (próxima) | — |
| 2 — Frontend scaffold & design system | ⬜ No iniciada | — |
| 3 — Web3 wiring | ⬜ No iniciada | — |
| 4 — Core pages (role-based) | ⬜ No iniciada | — |
| 5 — Certificates + IPFS | ⬜ No iniciada | — |
| 6 — Traceability visualization & public verify | ⬜ No iniciada | — |
| 7 — Innovation layer (indexer, MCP, AI) | ⬜ No iniciada | — |
| 8 — Polish, test, i18n, deploy, record | ⬜ No iniciada | — |

---

## Phase 0 — Setup, SDD, scaffolding *(target: 1 sesión)*

- [x] Confirmar nombre del proyecto → **HemaChain**
- [x] Confirmar industria → donaciones de sangre con marco regulatorio argentino
- [x] Confirmar scope → Maximum (target 100/100)
- [x] Confirmar testnet → Sepolia
- [x] Confirmar UI strategy → Build fresh, inspired by escrow design tokens
- [x] Confirmar idiomas → ES (default), PT, EN — i18n diferido a Phase 8
- [x] Mirror GitHub creado (`github.com/agamezg/hemachain`)
- [x] **★** Escribir `README.md` v0.1 (español, 14 secciones)
- [x] **★** Escribir `docs/SDD.md` v0.1 (15 secciones, español)
- [x] Escribir `docs/TRACK.md` (este archivo)
- [x] Escribir `IA.md` v0.1
- [x] **★** Init Foundry: `forge init sc --no-git` + `forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git` *(commit `5c777f5`)*
- [x] **★** Init Next.js: `npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias '@/*' --use-npm --turbopack` *(commit `5c777f5`)*
- [x] Crear `LICENSE` (MIT, con nota sobre adopción estatal argentina)
- [x] Actualizar `.gitignore` (Obsidian, Foundry, Next.js, indexer, mcp-server, .pids, .logs/)
- [x] Commit `chore(scaffold): initialize Foundry (sc/) and Next.js (web/) projects` *(commit `5c777f5`)*
- [x] **Bonus** — `restart.sh` + `stop.sh` para orquestar el stack local *(commit `4b73030`)*
- [x] **Bonus** — Git hooks: pre-commit (lint), commit-msg (Conventional Commits), pre-push (tests + mirror al otro remote) *(commit `4b73030`)*
- [x] **Bonus** — `scripts/install-hooks.sh` (activa `core.hooksPath=scripts/hooks`) *(commit `4b73030`)*
- [x] **Push verificado**: ambos remotes en `4b73030`; el pre-push hook ejecutó `forge test` (2 pass), `npm run lint` (pass) y mirror a `gitlab`
- [ ] Scaffold `indexer/` — *movido a Phase 7 (innovation layer)*
- [ ] Scaffold `mcp-server/` — *movido a Phase 7 (innovation layer)*
- **DoD:** ✅ `forge build` y `npm run build` ambos verdes; SDD ≥ §4 escrito; repo pusheado a ambos remotes.

---

## Phase 1 — Smart contracts (Foundry, TDD) *(2–3 sesiones)*

### 1.1. `HemaRegistry.sol`
- [ ] **★** Estructura básica con `AccessControl` y constantes de roles
- [ ] **★** `requestRole(role, name, country)`
- [ ] **★** `approveRole(actor)` / `rejectRole(actor)` / `revokeRole(role, actor)`
- [ ] `actorOf(addr)` / `isActive(addr)`
- [ ] Eventos: `ActorRegistered`, `RoleRequested`, `RoleApproved`, `RoleRejected`, `RoleRevoked`
- [ ] Custom errors
- [ ] NatSpec completo
- [ ] Tests `HemaRegistry.t.sol` (≥ 15 tests, happy + unhappy)

### 1.2. `HemaTraceability.sol`
- [ ] **★** Structs: `DonationUnit`, `TestResult`, `Component`, `ProcessRecord`, `CustodyEvent`, `AdverseEvent`
- [ ] **★** Enums: `UnitStatus`, `ComponentStatus`, `ComponentType`, `AdverseKind`
- [ ] **★** `registerDonation(donorIdHash, volumeMl, aboRhCode)`
- [ ] **★** `recordTestResult(unitId, hiv, hbv, hcv, syphilis, htlv, chagas, abo)`
- [ ] **★** `releaseUnit(unitId)` / `quarantineUnit(unitId, reason)`
- [ ] **★** `produceComponent(parentUnitId, type, volumeMl)` — incluye expiresAt automático
- [ ] **★** `transferCustody(componentId, to, temperatureC, gpsHash, signedHandoffHash)` — incluye cold-chain gate
- [ ] **★** `crossMatch(componentId, patientHash)`
- [ ] **★** `recordTransfusion(componentId)`
- [ ] **★** `reportAdverseEvent(kind, triggerHash)` — propagación de recall O(n)
- [ ] Funciones de lectura: `getUnit`, `getComponent`, `getFullTraceability(id)`
- [ ] Custom errors
- [ ] NatSpec completo
- [ ] Tests `HemaTraceability.t.sol` (≥ 30 tests)

### 1.3. `HemaCertificate.sol`
- [ ] **★** Hereda `ERC721URIStorage` + `AccessControl`
- [ ] **★** `issueCertificate(subject, type, expiresAt, documentHash, ipfsCID)`
- [ ] **★** `revokeCertificate(tokenId, reason)`
- [ ] `statusOf(tokenId)` — Valid/Expired/Revoked
- [ ] `tokenURI(tokenId)` con JSON compatible OpenSea
- [ ] Custom errors
- [ ] NatSpec completo
- [ ] Tests `HemaCertificate.t.sol` (≥ 12 tests)

### 1.4. Test suite — invariantes y fuzz
- [ ] `INV_VolumeConserved`
- [ ] `INV_RecallPropagates`
- [ ] `INV_NoExpiredTransfusion`
- [ ] `INV_ColdChainGate`
- [ ] `INV_RoleScoping` (uno por rol × función)
- [ ] `INV_DonorHashImmutable`
- [ ] `INV_CertificateMonotonic`
- [ ] Fuzz tests para state transitions

### 1.5. `lib/Codes.sol`
- [ ] Constantes ISBT 128 (ABO/Rh codes)
- [ ] Helpers `daysToExpiry(componentType)` (RBC 42 / FFP 365 / PLT 5 / CRYO 365)
- [ ] Helpers de validación de rangos de temperatura por tipo

### 1.6. Deployment
- [ ] **★** `script/Deploy.s.sol` (deploya los 3 + cablea roles iniciales)
- [ ] **★** `script/Seed.s.sol` (carga datos demo: 30 donantes, 50 donaciones, 1 look-back, 1 excursión, 1 revocación)
- [ ] Deploy a Anvil + smoke test con `cast`
- [ ] Tabla de gas en SDD §8.3

- **DoD:** `forge test` 100 % verde; ≥ 60 tests; invariant + fuzz suites pasan; tabla de gas en SDD §8.

---

## Phase 2 — Frontend scaffold & design system *(1–2 sesiones)*

- [ ] **★** Configurar Tailwind v4 con tokens del SDD §9.5
- [ ] **★** Crear `components/ui/`: `Button`, `Card`, `Badge`, `Container`, `InputField`, `Spinner`
- [ ] Instalar y configurar `sonner` (Toast provider)
- [ ] Instalar `next-themes` (dark mode toggle)
- [ ] Crear `app/[locale]/layout.tsx` con todos los providers
- [ ] **★** Sticky header con `WalletPill`, indicador de red, theme toggle, badge de rol
- [ ] **★** Landing page con hero + estadísticas placeholder
- [ ] **★** Externalizar **todas** las strings desde el día 1 (`useTranslations()`), aunque sólo `es.json` exista
- [ ] Footer simple con licencia y enlace a GitHub
- [ ] Commit `feat(web): design system + landing`
- **DoD:** Paridad visual con escrow (indigo/slate, JetBrains Mono); dark mode funciona; Lighthouse ≥ 90.

---

## Phase 3 — Web3 wiring *(1 sesión)*

- [ ] **★** `Web3Context` (BrowserProvider + JsonRpcProvider fallback)
- [ ] **★** `useWallet` hook (connect, disconnect, account, chainId)
- [ ] **★** `useContract` hook genérico
- [ ] Helper de chain switching (Anvil 31337 ↔ Sepolia 11155111)
- [ ] Auto-generación de ABIs + addresses a `web/src/contracts/` desde `sc/out/` post-deploy
- [ ] Persistence en localStorage
- [ ] Banner de "wrong network"
- [ ] `RoleContext` derivado de `HemaRegistry.actorOf()`
- **DoD:** Connect a Anvil, leer `actorOf(account)`, renderizar badge de rol.

---

## Phase 4 — Core pages (role-based) *(2–3 sesiones)*

- [ ] **★** `/connect` — flujo de solicitud de rol → evento `RoleRequested`
- [ ] **★** `/dashboard` — router por rol
- [ ] **★** `/dashboard/banco-sangre` — registrar donación
- [ ] **★** `/dashboard/laboratorio` — listar pendientes + cargar resultado de tamizaje + liberar/cuarentena
- [ ] **★** `/dashboard/fraccionamiento` — formulario de split en componentes
- [ ] **★** `/dashboard/banco` — grid de inventario, expiry, cadena de frío
- [ ] **★** `/dashboard/hospital` — prueba cruzada y transfusión
- [ ] `/dashboard/auditor` — sólo lectura + formulario de evento adverso
- [ ] `/dashboard/admin` — cola de aprobaciones de rol
- [ ] Validación en formularios + toasts tx-pending / success / error
- [ ] `/units/[id]` — detalle de unidad con timeline
- [ ] `/components/[id]` — detalle con cadena de custodia
- **DoD:** Un usuario puede recorrer una unidad de extremo a extremo en Anvil desde el navegador.

---

## Phase 5 — Certificates + IPFS *(1 sesión)*

- [ ] **★** Cuenta Pinata + `PINATA_JWT` en `.env.example`
- [ ] **★** Endpoint `/api/upload` con server-side upload a Pinata
- [ ] **★** UI de emisión: upload PDF → CID + `keccak256` → `HemaCertificate.issue(...)`
- [ ] `/certificates/[tokenId]` con verificación de hash antes de renderizar PDF
- [ ] Flujo de revocación (rol `CERTIFICADOR_ROLE`)
- [ ] `CertificateNFTCard` con QR de verificación
- [ ] `tokenURI` JSON compatible con OpenSea
- **DoD:** Emitir un cert AAHITC para un Hospital, verlo en `/certificates/[id]`, verificar hash, revocarlo.

---

## Phase 6 — Traceability visualization & public verify *(1–2 sesiones)*

- [ ] **★** `TraceabilityTimeline` (timeline vertical de custody + process)
- [ ] **★** `ComponentLineageTree` (Mermaid client-side)
- [ ] **★** `/verify/[id]` — **pública, sin wallet, sin locale lock** — cadena anonimizada
- [ ] **★** `QRVerifyCode` apuntando a `/verify/[id]` — imprimible
- [ ] Mapa con Leaflet de instituciones (registro off-chain de coordenadas)
- [ ] `ColdChainBadge` con sparkline (recharts)
- **DoD:** Imprimir un QR → escanear con el móvil → `/verify/[id]` muestra la cadena anónima.

---

## Phase 7 — Innovation layer (indexer, MCP, AI) *(1–2 sesiones, paralelizable)*

- [ ] Indexador: Node + ethers WS + SQLite + endpoint SSE
- [ ] Dashboards consumen SSE → toasts en vivo
- [ ] Daemon de alertas (expiry + cold-chain)
- [ ] MCP server: wrappers de `anvil`, `forge`, `cast`, `trace_query`
- [ ] Documento `docs/MCP.md`
- [ ] Agente IA flotante "Ask HemaChain" en el dashboard, llamando MCP via Claude API tool-use
- [ ] Demo seed enriquece el escenario
- **DoD:** Demo en vivo de toast tras tx + respuesta del agente IA a "¿cuántos GR expiran en 48h?".

---

## Phase 8 — Polish, test, i18n, deploy, record *(2 sesiones)*

### 8.1. Deploy + verificación
- [ ] **★** Deploy a Sepolia con private key segura
- [ ] **★** Verificación en Etherscan de los 3 contratos
- [ ] Actualizar tabla §6 del README con direcciones reales
- [ ] Re-run del seed sobre Sepolia (cantidad reducida, suficiente para video)

### 8.2. Documentación
- [ ] **★** Finalizar `README.md` (revisar todos los placeholders)
- [ ] **★** Finalizar `docs/SDD.md` (rellenar tabla de gas §8.3, agregar resultados de tests)
- [ ] **★** Finalizar `IA.md` (horas reales, errores comunes, valor agregado)
- [ ] `docs/manual-usuario.md` con uno-por-rol step-by-step
- [ ] Exportar diagramas Mermaid a PNG (`docs/arquitectura.png`, `docs/diagrama-flujo.png`)

### 8.3. Screenshots
- [ ] **★** `01-landing.png`
- [ ] **★** `02-dashboard-bank.png`
- [ ] **★** `03-traceability-timeline.png`
- [ ] **★** `04-certificate-nft.png`
- [ ] **★** `05-public-verify.png`
- [ ] `06-cold-chain-alert.png`
- [ ] `07-etherscan-tx.png`

### 8.4. i18n — capa de traducción
- [ ] Configurar `next-intl` con locales `es` (default), `pt`, `en`
- [ ] Verificar que toda string vive en `messages/{es,pt,en}.json`
- [ ] Selector de idioma en el header
- [ ] QA: cambiar a `pt` y `en` y verificar que ningún string queda hardcoded
- [ ] (opcional) `README.pt.md` y `README.en.md` con resumen ejecutivo

### 8.5. Video
- [ ] **★** Grabar Loom en español ≤ 5 min
  - 0:00–0:30 — intro: problema + Res. 536/2026
  - 0:30–1:30 — arquitectura técnica
  - 1:30–4:00 — demo en vivo end-to-end
  - 4:00–5:00 — innovaciones, visión de adopción estatal
- [ ] Verificar permisos "Anyone with link" en Loom
- [ ] Añadir link al README §10

### 8.6. Pre-submission checklist
- [ ] Repo GitHub público
- [ ] README renderiza correctamente
- [ ] Diagramas Mermaid visibles en GitHub
- [ ] Todos los links del README funcionan
- [ ] Repo GitLab (academia) sincronizado con `main`
- [ ] Video link funciona en navegador privado
- [ ] Contratos verificados en Etherscan
- [ ] Cambio de idioma funciona en los 3 locales
- [ ] 5+ screenshots presentes en `screenshots/`
- [ ] `IA.md` completado con horas y errores reales
- [ ] LICENSE presente

- **DoD:** Entrega final con todos los criterios del rúbrica direccionables línea a línea.

---

## Notas de retomada

> Sección libre para anotar al final de cada sesión qué quedó pendiente y dónde estaba el foco. Mover entradas a histórico cuando se completen.

### Sesión 2026-05-15 (inicial)
- Phase 0 documentación escrita: `README.md`, `docs/SDD.md`, `docs/TRACK.md`, `IA.md`.
- Próximo paso: scaffolds de Foundry y Next.js, primer commit `chore: scaffold project structure`.

### Sesión 2026-05-15 (continuación) — Phase 0 cerrada
- Scaffolds completos: `sc/` (Foundry + OpenZeppelin v5.1.0), `web/` (Next.js 15 + TS + Tailwind v4 + App Router + Turbopack).
- DevX completo: `restart.sh`, `stop.sh`, hooks (`pre-commit`, `commit-msg`, `pre-push`), `install-hooks.sh` activado via `core.hooksPath`.
- Tres commits en `main`: `374fffa` (docs) → `5c777f5` (scaffold) → `4b73030` (devx).
- Push a ambos remotes verificado: `origin` (GitHub) y `gitlab` (academia) en `4b73030`. El pre-push hook hizo el mirror automáticamente al pushear a origin.
- **Próximo paso al retomar:** Phase 1 — escribir `HemaRegistry.sol` con `AccessControl` + tests TDD. Reemplazar el scaffold de `Counter.sol`/`Counter.t.sol` con los contratos reales.
- Decisiones pendientes para Phase 1:
  - ¿`pragma solidity 0.8.24` o `0.8.30` (la que viene por defecto del forge init)? *Recomendación: 0.8.24 con `evm_version = "cancun"` para PUSH0 sin romper compatibilidad con redes pre-Shanghai.*
  - ¿Empezar por `HemaRegistry` (más simple) o `HemaTraceability` (núcleo del sistema)? *Recomendación: Registry primero — bloquea el resto.*
