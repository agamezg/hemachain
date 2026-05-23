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
> **Última actualización:** Phase 4 ✅ completa. Lifecycle on-chain end-to-end: donar → tamizar → fraccionar → despachar (cadena de frío) → cross-match → transfundir + hemovigilancia con look-back. Detail pages `/units/[id]` y `/components/[id]` con timelines. **9 sub-dashboards + 2 detalles dinámicos**, 30 rutas SSG + 2 dinámicas. Commits: B.1 `68ba600`, fixes `bf36c56` + `9681316`, B.2 `f18a107`, C `ff5a041`.

---

## Resumen ejecutivo del estado

| Fase | Estado | DoD alcanzada | Tokens estim. | Tokens reales |
|---|---|:-:|---:|---:|
| 0 — Setup, SDD, scaffolding | ✅ Completa | Sí (`forge build` y `npm run build` verdes; documentación inicial escrita; ambos remotes pusheados) | ~120k | ~180k† |
| 1 — Smart contracts | ✅ Completa | Sí (`forge test` 110/110 verdes; invariantes + fuzz; Deploy/Seed smoke-tested en Anvil; gas snapshot capturado) | ~400k | ~550k† |
| 2 — Frontend scaffold & design system | ✅ Completa | Sí (`npm run lint` y `npm run build` verdes; 6 páginas estáticas — `/_not-found`, `/es`, `/pt`, `/en` × layout — + proxy middleware; design tokens + UI lib + header/footer + landing con i18n día 1) | ~150k | ~140k |
| 3 — Web3 wiring | ✅ Completa | Sí (`npm run lint` + `npm run build` verdes; Web3Provider + RoleProvider; `useWallet`/`useContract`/`useRole`; ABIs por chainId + addresses Anvil deterministas verificadas con `cast`; UI: WalletPill, NetworkBadge, RoleBadge, WrongNetworkBanner) | ~100k | ~110k |
| 4 — Core pages (role-based) | ✅ Completa | Lifecycle end-to-end on Anvil: 7 paneles rol-específicos + admin + 2 detail pages. Lint+build limpios. Bug-fixes: PositiveScreening gate + splitVolumeOf semantics. | ~300k | ~310k |
| 5 — Certificates + IPFS | ⬜ No iniciada (próxima) | — | ~100k | — |
| 6 — Traceability visualization & public verify | ⬜ No iniciada | — | ~150k | — |
| 7 — Innovation layer (indexer, MCP, AI) | ⬜ No iniciada | — | ~250k | — |
| 8 — Polish, test, i18n, deploy, record | ⬜ No iniciada | — | ~200k | — |

> **Notas sobre las columnas de tokens.**
> - "Tokens estim." es el presupuesto forward que vamos a apuntar por fase (input + output sumados, en miles de tokens del modelo principal — Opus 4.7).
> - "Tokens reales" es el consumo real **post-DoD** de la fase.
> - † Valores marcados con cruz son **reconstrucciones post-hoc** (no hay telemetría guardada de las sesiones previas a 2026-05-22); se conservan como orden de magnitud, no como cifra exacta.
> - Phase 2 es el primer registro tomado con sesión completa visible. Phase 3+ se actualizan al cierre real de cada fase, no antes.
> - Total estimado del TFM: **~1,770k tokens** (≈ 1.77 M). Insumo para `IA.md` §"horas y costo".

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
- [x] Scaffold `indexer/` — package.json + README.md (placeholder, contenido en Phase 7)
- [x] Scaffold `mcp-server/` — package.json + README.md (placeholder, contenido en Phase 7)
- [x] **Verificación DoD:** `forge build` ✓ (`No files changed, compilation skipped`) y `npm run build` ✓ (Next.js 16.2.6 Turbopack, 4 páginas estáticas)
- **DoD:** ✅ `forge build` y `npm run build` ambos verdes; SDD ≥ §4 escrito; repo pusheado a ambos remotes.

---

## Phase 1 — Smart contracts (Foundry, TDD) *(2–3 sesiones)*

### 1.1. `HemaRegistry.sol`
- [x] **★** Estructura básica con `AccessControlEnumerable` y constantes de roles
- [x] **★** `requestRole(role, name, country)`
- [x] **★** `approveRole(actor)` / `rejectRole(actor)` / `revokeRole(role, actor)` (inherited)
- [x] `actorOf(addr)` / `isActive(addr)` (derived from `hasRole` to stay consistent on revoke)
- [x] Eventos: `RoleRequested`, `RoleApproved`, `RoleRejected`, `ActorRegistered` (+ `RoleGranted`/`RoleRevoked` from AccessControl)
- [x] Custom errors (`InvalidRole`, `AlreadyRegistered`, `RequestAlreadyExists`, `NoPendingRequest`)
- [x] NatSpec completo
- [x] Tests `HemaRegistry.t.sol` — **26 tests** (happy + unhappy + enumerable)

### 1.2. `HemaTraceability.sol`
- [x] **★** Structs: `DonationUnit`, `TestResult`, `Component` (decidido NO almacenar `CustodyEvent`/`ProcessRecord` on-chain — se reconstruyen del indexador, SDD §10.2)
- [x] **★** Enums: `UnitStatus`, `ComponentStatus`, `ReleaseStatus`, `AdverseKind` (`ComponentType` vive en `lib/Codes.sol`)
- [x] **★** `registerDonation(donorIdHash, volumeMl, aboRhCode)`
- [x] **★** `recordTestResult(unitId, hiv, hbv, hcv, syphilis, htlv, chagas, abo)`
- [x] **★** `releaseUnit(unitId)` / `quarantineUnit(unitId, reason)`
- [x] **★** `produceComponent(parentUnitId, type, volumeMl)` — `expiresAt` automático vía `Codes.expiryAt`
- [x] **★** `transferComponentCustody(componentId, to, temperatureC, gpsHash, signedHandoffHash)` — cold-chain gate
- [x] **★** `crossMatch(componentId, patientHash)`
- [x] **★** `recordTransfusion(componentId)`
- [x] **★** `reportAdverseEvent(kind, triggerHash)` — propagación O(n) sobre `_unitsByDonor` + `_componentsByUnit`
- [x] Funciones de lectura: `getUnit`, `getTestResult`, `getComponent`, `getUnitsByDonor`, `getComponentsByUnit`, `splitVolumeOf`
- [x] Custom errors (15 errors específicos)
- [x] NatSpec completo (con tabla de invariantes en el `@dev` de la clase)
- [x] Tests `HemaTraceability.t.sol` — **37 tests** (lifecycle completo + look-back idempotencia + Chagas + temp excursion + volume conservation)
- [~] `transferUnitCustody` — diferido: el flujo demo usa transferencias implícitas al cambiar de rol; agregar en Phase 4 si la UI lo necesita

### 1.3. `HemaCertificate.sol`
- [x] **★** Hereda `ERC721URIStorage`; roles delegados a `HemaRegistry` (no AccessControl local)
- [x] **★** `issueCertificate(subject, type, expiresAt, documentHash, ipfsCID)`
- [x] **★** `revokeCertificate(tokenId, reason)` — rechaza si ya `Expired` (monotonía)
- [x] `statusOf(tokenId)` — `Valid` / `Expired` / `Revoked` derivado de (`revoked`, `expiresAt`, `block.timestamp`)
- [x] `tokenURI(tokenId)` — apunta a `ipfs://<CID>`; el JSON OpenSea-compatible vive en IPFS (más estándar que generar on-chain)
- [x] Custom errors (8 errors)
- [x] NatSpec completo
- [x] Tests `HemaCertificate.t.sol` — **20 tests** (issuance + monotonic transitions + ERC-721 transferability)

### 1.4. Test suite — invariantes y fuzz
- [x] `INV_VolumeConserved` — invariant test handler-driven (3840 calls/run, 256 runs)
- [x] `INV_RecallPropagates` — unit-tested en `test_LookBack_RecallsAllDerivedComponents`
- [x] `INV_NoExpiredTransfusion` — unit-tested en `test_CrossMatch_RevertsAfterExpiry`
- [x] `INV_ColdChainGate` — unit-tested en `test_TransferComponentCustody_TempExcursionRecalls`
- [x] `INV_RoleScoping` — unit-tested vía `_RevertsForNon*` por función
- [x] `INV_DonorHashImmutable` — invariant test handler-driven
- [x] `INV_CertificateMonotonic` — fuzz tests `testFuzz_RevokedDominatesTimeWarp` + `testFuzz_CannotRevokeExpired`
- [x] Fuzz tests para state transitions (vía handler de invariantes)

### 1.5. `lib/Codes.sol`
- [x] Constantes ISBT 128 (8 códigos ABO/Rh packed en `bytes8`)
- [x] Helpers `shelfLifeDays(componentType)` (RBC 42 / FFP 365 / PLT 5 / CRYO 365) + `expiryAt(ct, producedAt)`
- [x] Helpers de validación de rangos de temperatura por tipo (`isTempInRange`)
- [x] Tests `Codes.t.sol` — **22 tests**

### 1.6. Deployment
- [x] **★** `script/Deploy.s.sol` (deploya los 3 con admin = broadcaster; default a Anvil PK#0)
- [x] **★** `script/Seed.s.sol` (carga demo: 6 actores, 3 donaciones, 3 componentes, 1 look-back, 1 excursión, 1 cert revocada — versión reducida vs. 30 donantes; suficiente para video)
- [x] Deploy a Anvil + smoke test con `cast` (banco activo, componente 1 recalled, componente 3 transfundido, cert 1 revocada)
- [x] Tabla de gas en SDD §8.3 (capturada en `sc/.gas-snapshot`)

- **DoD:** ✅ `forge test` 110/110 verde; **105 unit + 3 invariant + 2 fuzz**; tabla de gas y notas en SDD §8.3; Deploy/Seed smoke-tested.

---

## Phase 2 — Frontend scaffold & design system *(1–2 sesiones)*

- [x] **★** Configurar Tailwind v4 con tokens del SDD §9.5 (`@theme` + `@custom-variant dark`)
- [x] **★** Crear `components/ui/`: `Button`, `Card`, `Badge`, `Container`, `InputField`, `Spinner`
- [x] Instalar y configurar `sonner` (Toaster montado en `[locale]/layout.tsx`)
- [x] Instalar `next-themes` (dark mode toggle vía `resolvedTheme` nullability — Next 16 prohíbe `useEffect→setState`)
- [x] Crear `app/[locale]/layout.tsx` con todos los providers (Theme + NextIntlClient + Toaster + Header/Footer)
- [x] **★** Sticky header con `WalletPill` (stub), `NetworkBadge`, `ThemeToggle`, `RoleBadge`, `LocaleSwitch`
- [x] **★** Landing page con hero + estadísticas placeholder + sección de innovaciones + bloque regulatorio + CTA
- [x] **★** Externalizar **todas** las strings desde el día 1 (`useTranslations()`); `es.json` completo, `pt.json` y `en.json` con las mismas claves para que Phase 8 sólo traduzca
- [x] Footer simple con licencia y enlaces a GitHub / SDD / README
- [x] Commit `feat(web): design system + landing` *(commit `67da936`)*
- [x] **Bonus** — `next-intl` middleware adelantado (Phase 8) — `src/proxy.ts` con `createMiddleware(routing)`; `/` → 307 `/es` con cookie `NEXT_LOCALE`
- **DoD:** ✅ `npm run lint` y `npm run build` verdes (Next 16.2.6 Turbopack); dark mode toggle visible; 6 páginas estáticas + proxy middleware compilados; smoke test dev en `:3001` redirige `/` a `/es` y sirve `/pt`/`/en` con código 200.

---

## Phase 3 — Web3 wiring *(1 sesión)*

- [x] **★** `Web3Provider` (BrowserProvider + JsonRpcProvider fallback) — `src/providers/Web3Provider.tsx`
- [x] **★** `useWallet` hook (connect, disconnect, account, chainId, switchChain, signer)
- [x] **★** `useContract(name, { withSigner? })` hook genérico — read vía readProvider, write vía signer cuando se pide y la red coincide
- [x] Helper de chain switching (Anvil 31337 ↔ Sepolia 11155111) con manejo del code 4902 (`wallet_addEthereumChain`)
- [x] Auto-generación de ABIs + addresses a `web/src/contracts/` desde `sc/out/` post-deploy — `restart.sh` ya lo hace; ABIs commiteados como baseline
- [x] Persistence en localStorage (`hemachain.wallet=connected`) + auto-reconnect silencioso en mount
- [x] Banner de "wrong network" con switch chain — `WrongNetworkBanner.tsx`
- [x] `RoleProvider` derivado de `HemaRegistry.actorOf()` — `src/providers/RoleProvider.tsx`; reset de estado en render-phase (patrón endosado por React 19) para sortear `react-hooks/set-state-in-effect`
- **DoD:** ✅ Connect a Anvil verifica direcciones deterministas (cast call coincide), `actorOf(account)` retorna struct tipada, `RoleBadge` renderiza i18n del rol activo. Lint + build verdes. Commit `4026897`.

---

## Phase 4 — Core pages (role-based) *(2–3 sesiones, ahora cortada en Capas A/B/C)*

### Capa A — Onboarding + admin (✅ commit `b170da8`)

- [x] **★** `/connect` — flujo de solicitud de rol → evento `RoleRequested`, validación form + tx UX
- [x] **★** `/dashboard` — router por rol (hasInjected → connect → noRole → admin → roleAssigned)
- [x] `/dashboard/admin` — cola de aprobaciones derivada de logs (RoleRequested/Approved/Rejected fold)
- [x] Validación en formularios + toasts tx-pending / success / error — `useTransaction` hook con sonner
- [x] `RoleProvider` extendido con `isAdmin` (constructor-granted role no aparece en `actorOf`)
- [x] CTAs de `Hero` y `CtaSection` usan `useLocale()` y resuelven `/{locale}/connect`

### Capa B — Sub-dashboards por rol

#### B.1 — Mitad inicial del lifecycle (✅ commit `68ba600`)

- [x] **★** `/dashboard/banco-sangre` — registrar donación + lista de mis donaciones (filtrada por collectionCenter)
- [x] **★** `/dashboard/laboratorio` — cola Collected → recordTestResult con 6 marcadores + ABO; cola UnderTest → release / quarantine con reason
- [x] **★** `/dashboard/fraccionamiento` — produceComponent con `splitVolumeOf` para validar volumen restante; dropdown de tipos con shelf life + temp range visibles
- [x] **Shared infra:** `useDonations(opts)`, `RoleGate`, `src/lib/hashing.ts`, `src/lib/isbt.ts`

#### B.2 — Lifecycle tardío (✅ commit `f18a107`)

- [x] **★** `/dashboard/banco` — `ComponentInventory` (custody = msg.sender) + `TransferCustodyForm` con cold-chain gating (temp fuera de rango → tx recalls auto)
- [x] **★** `/dashboard/hospital` — `HospitalPanel`: crossMatch (componentes Produced/InStorage en custodia → patientHash) + recordTransfusion sobre Reserved
- [x] `/dashboard/auditor` — `AuditorPanel`: reportAdverseEvent (3 kinds, hint contextual por kind) + timeline de los últimos 40 eventos vía `useChainEvents`
- [x] **Shared infra:** `useComponents`, `useChainEvents`, `ComponentInventory` (reusada también en hospital), `Timeline`
- [x] Embed `TransferCustodyForm` también en `/dashboard/fraccionamiento` (el contrato sólo chequea custodian, no rol)

### Capa C — Detalle + trazabilidad pública (✅ commit `ff5a041`)

- [x] `/units/[id]` — `useUnitDetail` (getUnit + getTestResult + children) + timeline con eventos indexed por unitId; clickable rows en `DonationList`
- [x] `/components/[id]` — `useComponentDetail` (getComponent + custody chain events) + link al padre; clickable rows en `ComponentInventory`
- [x] **Shared `Timeline`** — branch-style ol con tone por evento; switch-based summariser cubre los 10 eventos
- [x] Detail pages son públicas (sin RoleGate) — datos ya anonimizados via hashes, reusables en Phase 6 `/verify`

- **DoD Phase 4:** ✅ Un usuario puede recorrer una unidad de extremo a extremo en Anvil desde el navegador. Smoke verificado: donar (PK#1) → tamizar (PK#2) → fraccionar (PK#3) → transferir custodia con temp en rango (PK#3 → PK#1 o PK#4) → cross-match (PK#4) → transfundir (PK#4) → auditor reporta DonorPositive → look-back propaga recall.

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

### Sesión 2026-05-15 (continuación) — Phase 0 al 95 %
- Scaffolds completos: `sc/` (Foundry + OpenZeppelin v5.1.0), `web/` (Next.js 15 + TS + Tailwind v4 + App Router + Turbopack).
- DevX completo: `restart.sh`, `stop.sh`, hooks (`pre-commit`, `commit-msg`, `pre-push`), `install-hooks.sh` activado via `core.hooksPath`.
- Tres commits en `main`: `374fffa` (docs) → `5c777f5` (scaffold) → `4b73030` (devx).
- Push a ambos remotes verificado: `origin` (GitHub) y `gitlab` (academia) en `4b73030`. El pre-push hook hizo el mirror automáticamente al pushear a origin.

### Sesión 2026-05-17 — Phase 0 sellada ✅
- Agregados `indexer/` y `mcp-server/` como placeholders (package.json + README cada uno) — la estructura del monorepo queda visible desde el día 1 sin necesidad de "movido a Phase 7" en el tracker.
- Verificación de DoD ejecutada y verde:
  - `cd sc && forge build` → `compilation skipped` (todo OK).
  - `cd web && npm run build` → Next.js 16.2.6 (Turbopack), 4 páginas estáticas generadas.
- Memoria del agente actualizada (6 archivos en `~/.claude/projects/.../memory/`) para arranque rápido en próximas sesiones.
- **Próximo paso al retomar:** **Phase 1 — Smart contracts**. Empezar por `HemaRegistry.sol` (gates el resto), TDD con `forge test`. Reemplazar `sc/src/Counter.sol`, `sc/test/Counter.t.sol`, `sc/script/Counter.s.sol` con los contratos reales.
- Decisiones pendientes para Phase 1:
  - **pragma**: `0.8.24` (PUSH0, EVM Shanghai+) o `0.8.30` (default actual de Forge). Recomendación: `0.8.24` + `evm_version = "cancun"` en `foundry.toml` para máxima compatibilidad y disponibilidad en Sepolia/Anvil.
  - **Orden**: `HemaRegistry` → `HemaTraceability` → `HemaCertificate`. Registry primero porque sin roles no funciona nada más.
  - **OZ AccessControl**: usar `AccessControl` plano o `AccessControlEnumerable` (más caro pero permite listar holders por rol — útil para el admin dashboard).

### Sesión 2026-05-21 — Phase 1 sellada ✅
- **Decisiones tomadas:** `0.8.24 + cancun`, `AccessControlEnumerable`, orden Registry → Codes → Traceability → Certificate → Invariants → Deploy/Seed.
- **Commits landed (8):** `e292e0c` (CLAUDE.md), `abe1084` (foundry.toml), `e45d6d4` (HemaRegistry + 26 tests, Counter borrado), `f6a915f` (Codes lib + 22 tests), `8b3c831` (HemaTraceability + 37 tests), `fea1c32` (HemaCertificate + 20 tests), `683ca8b` (Invariants + fuzz), `6072bbf` (Deploy/Seed + gas snapshot). **No pusheado** todavía — el usuario revisa antes del primer push.
- **Test count final:** 110/110 verde — 26 Registry + 22 Codes + 37 Traceability + 20 Certificate + 3 invariants + 2 fuzz. Cada commit pasa el pre-commit hook (`forge fmt --check`).
- **Decisiones de diseño que se apartaron del SDD (con justificación):**
  - `CustodyEvent` no se persiste on-chain — toda la info se emite vía eventos (`ComponentCustodyTransferred`) y el indexador de Phase 7 reconstruye historia. Ahorra ~80k gas por handoff.
  - `transferUnitCustody` diferido — la custodia de la unidad se actualiza implícitamente cuando el lab toma el control en `recordTestResult`. Si la UI de Phase 4 necesita el evento explícito, se agrega entonces.
  - `tokenURI` apunta a `ipfs://<CID>` en lugar de generar JSON on-chain — más estándar, más barato, y permite metadata enriquecida (imagen del cert, atributos OpenSea) sin tocar el contrato.
  - `ComponentType` vive en `lib/Codes.sol` (no en `HemaTraceability`) para que el lib pueda razonar sobre tipos sin importar el contrato.
- **Gas vs. NFR-Perf-1 (< 200k típico):**
  - `registerDonation` 192k ✓ — al límite por structs anidados con strings (institution metadata) en `_unitsByDonor.push`.
  - `recordTestResult` 151k ✓
  - `produceComponent` 268k ⚠️ — excede el target. Razón: escribe struct grande + pushes a `_componentsByUnit` + actualiza padre. Aceptable para TFM; revisar en Phase 8 si Sepolia gas es un problema.
  - `transferComponentCustody` 53k ✓
  - `reportAdverseEvent` 53k–99k para 1–2 unidades ✓ (escala lineal con #componentes).
- **Próximo paso al retomar:** **Phase 2 — Frontend scaffold & design system**. Tres trabajos paralelizables:
  1. Tailwind v4 tokens en `web/src/app/globals.css` (`@custom-variant` para dark, no `tailwind.config.js`).
  2. Componentes base en `web/src/components/ui/` (`Button`, `Card`, `Badge`, `Container`, `InputField`, `Spinner`).
  3. Landing en `web/src/app/[locale]/page.tsx` con `next-intl` desde el día 1 (`useTranslations()` en todas las strings — no hardcodear ni siquiera el español).
- **Re-leer antes de Phase 2:** `web/AGENTS.md` (Next.js 16.2.6, no la versión del training data) y `docs/SDD.md` §9 (mapa de rutas, contextos, biblioteca de componentes).

### Sesión 2026-05-22 — Phase 2 sellada ✅
- **Comando-pivot:** Next 16 renombró `middleware.js` → `proxy.js` (file convention oficial, doc en `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). El export se llama igual (`proxy` o `default`), pero el archivo es `src/proxy.ts` y `next-intl`'s `createMiddleware` se exporta vía esa ruta sin cambios.
- **Lint trap nuevo en Next 16:** la regla `react-hooks/set-state-in-effect` rechaza el patrón canónico `useEffect(() => setMounted(true), [])` que se usaba para diferir la hidratación. Solución limpia con `next-themes`: chequear `resolvedTheme !== undefined` como proxy de "ya hidrató" (ver `src/components/site/ThemeToggle.tsx`).
- **Decisiones de arquitectura:**
  - **Sin root `app/layout.tsx`.** Patrón canónico de next-intl 4: `<html>`/`<body>` viven en `app/[locale]/layout.tsx`. Cuando Phase 6 agregue `/verify/[id]` (locale-less), se usa un route group `app/(public)/` con su propio layout.
  - **Proxy matcher**: `'/((?!api|_next|_vercel|.*\\..*).*)'` excluye assets estáticos. Sin esto, el proxy intercepta el favicon y rompe.
  - **`localePrefix: 'always'`** — todas las rutas localizadas requieren prefijo (`/es/...`). Mantiene previsibilidad para Phase 6 (la única ruta sin prefijo es `/verify`).
  - **`pt.json` y `en.json` con copias del español, no vacíos.** Phase 8 traduce, no agrega claves — esto evita que cualquier render anticipado en pt/en explote por keys faltantes.
  - **Tokens Tailwind v4 con `color-mix(in srgb, …)`** para tonos suaves en badges (ej. `bg-color-mix(...primary 15%, transparent)`). Cero declaraciones extra de colores, todo derivado del primary.
- **Build / lint / smoke:**
  - `npm run build` → 6 páginas estáticas (`/_not-found`, `/[locale]` × 3) + proxy middleware. ~1.4s compile, ~1.7s typecheck.
  - `npm run lint` → 0 errores.
  - Dev smoke en `:3001`: `/` → 307 `/es` con cookie `NEXT_LOCALE=es`; `/pt` y `/en` → 200; título y contenido aparecen en HTML server-rendered.
  - **Warning conocido** (no bloqueante): Turbopack detecta dos lockfiles (`/home/kratos/package-lock.json` y `web/package-lock.json`) y elige el de arriba como root. Si llega a molestar, se silencia en Phase 3 con `turbopack: { root: import.meta.dirname }` en `next.config.ts`.
- **Diferido conscientemente:**
  - `tailwind.config.js`: **no existe ni debe existir en v4**. La regla la garantiza el SDD §9 y el `AGENTS.md`.
  - `WalletPill`, `NetworkBadge`, `RoleBadge` son **stubs** (gris, disabled, con `title="Phase 3"`). Se llenan en Phase 3 cuando llegue Web3 wiring.
  - Hero CTA apunta a `connect` (relativo a la página actual) — la ruta `/[locale]/connect` no existe todavía; Phase 4 la agrega.
- **Próximo paso al retomar:** **Phase 3 — Web3 wiring**. Foco:
  1. `src/providers/Web3Provider.tsx` (BrowserProvider + JsonRpcProvider fallback) + `useWallet` hook.
  2. `useContract` genérico tipado contra los ABIs auto-copiados a `web/src/contracts/` por `restart.sh`.
  3. Chain switching (Anvil 31337 ↔ Sepolia 11155111) + persistence localStorage.
  4. Conectar `WalletPill` real reemplazando el stub; banner de "wrong network".
  5. `RoleContext` derivado de `HemaRegistry.actorOf()` — usa los ABIs reales del commit `6072bbf`.
- **Re-leer antes de Phase 3:** `docs/SDD.md` §9.3 (contextos), `web/AGENTS.md` (Next 16 caveats — esp. `set-state-in-effect`), y el ABI en `sc/out/HemaRegistry.sol/HemaRegistry.json` para confirmar las firmas que vamos a consumir.

### Sesión 2026-05-22 — Phase 3 sellada ✅
- **Stack Web3 cableado en un commit (`4026897`).** Una sesión, ~110k tokens reales vs. ~100k estimados — bastante en línea.
- **Decisiones de arquitectura:**
  - **Direcciones de contratos hardcodeadas para Anvil** (`0x5FbDB…`, `0xe7f1725E…`, `0x9fE46736…`) — son las salidas determinísticas de `Deploy.s.sol` desde la cuenta 0 a nonces 0/1/2. Verificadas en vivo con `cast call` post-`restart.sh`. Anvil + nuestro deploy script son deterministas, así que esto funciona sin lookup dinámico; si en algún momento el script cambia de orden, se overridea con `NEXT_PUBLIC_*_ADDRESS` desde `.env.local`.
  - **`Web3Provider` no usa `eth_requestAccounts` en mount.** Sólo lee `eth_accounts` (silencioso) y reconstruye state si MetaMask ya tiene la cuenta autorizada. Esto evita el popup al primer load. Sólo cuando el usuario aprieta `Conectar` se dispara `eth_requestAccounts`.
  - **Readonly por defecto.** `useContract(name)` retorna un Contract conectado al `JsonRpcProvider` del default chain, sin importar si el usuario está conectado o no. Para escritura se pide `{ withSigner: true }` y se verifica `isCorrectChain`. Esto permite que el landing/verify funcionen sin wallet (cumple SDD §9 — `/verify` es wallet-less).
  - **ABIs commiteados a `web/src/contracts/`.** No están gitignored. `restart.sh` los refresca en cada deploy; el commit baseline asegura builds en CI sin necesidad de Anvil corriendo.
  - **`!.env.example` exception en `web/.gitignore`** — la regla `.env*` de create-next-app es muy agresiva.
- **Trampa Next 16 vol. 2 — `react-hooks/set-state-in-effect` (segunda vez).**
  Cualquier `useEffect` que llame a setState sincrónicamente (incluso indirectamente vía una función) se rechaza. La primera vez (Phase 2 ThemeToggle) salimos por la nullability de `resolvedTheme`. Esta vez, `RoleProvider` necesita resetear estado cuando cambia la cuenta — solución limpia: **comparar inputs y resetear en render-phase** (patrón del docs de React 19), con el efecto sólo escribiendo setState dentro de `.then`/`.catch` (que la regla acepta como "subscribe-and-update-in-callback"):
  ```ts
  const [tracked, setTracked] = useState({ account: null, hasContract: false });
  if (tracked.account !== account || tracked.hasContract !== hasContract) {
    setTracked({ account, hasContract });
    setState(initial);  // reset en render-phase, no en efecto
  }
  useEffect(() => { /* sólo fetches con setState dentro de .then/.catch */ }, [...]);
  ```
  Vale la pena recordar el patrón — todo provider futuro que sincronice con cambios de cuenta/chain lo va a necesitar.
- **`tsconfig.json` bumped ES2017 → ES2020.** BigInt literals (`0n`) son necesarios para comparar `actor.registeredAt`. Sin esto el typecheck falla aunque el code compile en runtime (Node 22). No bumpear más alto innecesariamente; algunas libs de proveedores RPC todavía publican code targeting ES2020.
- **Smoke checklist Phase 3** (re-correrla al inicio de Phase 4):
  1. `./restart.sh` arranca Anvil + deploya.
  2. `cast call $REGISTRY 'BANCO_SANGRE_ROLE()(bytes32)'` retorna `0x3edb176…` (= `keccak256("BANCO_SANGRE")`).
  3. `cd web && npm run dev` levanta sin errores; `/es` renderiza con providers montados.
  4. MetaMask en `http://localhost:8545` chainId 31337 + importar PK#1 → click `Conectar` → WalletPill muestra short-address con dot verde.
  5. Importar PK#0 (admin) → RoleBadge muestra `Sin rol` (admin sólo tiene DEFAULT_ADMIN_ROLE, no es un actor registrado). Esto es **comportamiento esperado** y confirma que el flujo request/approve de Phase 4 va a ser el primer onboarding real de actores.
- **Próximo paso al retomar:** **Phase 4 — Core pages role-based**. Foco:
  1. `/[locale]/connect` — formulario `requestRole(role, name, country)` con dropdown de roles, validación, tx flow (pending → success → toast).
  2. `/[locale]/dashboard` — router que lee `useRole()` y redirige al sub-dashboard según `roleKey`.
  3. `/[locale]/dashboard/admin` — cola de `RoleRequested` events pendientes con botón approve/reject (usa events del indexador en Phase 7; en Phase 4 hace `getLogs` directo).
  4. Sub-dashboards uno por rol con la acción principal de cada uno (banco: registrar donación; lab: cargar resultado; frac: producir componente; banco/almacén: ver inventario; hospital: prueba cruzada + transfundir; auditor: report adverse event).
  5. Páginas `/units/[id]` y `/components/[id]` con detalle + timeline (los datos vienen de `getUnit`/`getComponent` + `getLogs` para custody chain).
- **Re-leer antes de Phase 4:** `docs/SDD.md` §9.2 (mapa completo de rutas + permisos), §4 (FR-5 a FR-18 — cada función one-to-one con una acción de UI), y el ABI de `HemaTraceability` para confirmar todas las firmas de write.

### Sesión 2026-05-23 — Phase 4 Capa A sellada ✅ (B+C pendientes)
- **Decisión de cadencia:** Phase 4 era ~300k estimados; la cortamos en 3 capas (A: onboarding+admin, B: sub-dashboards, C: detalle) para no quedarse sin contexto. Capa A consumió **~120k** y rinde un end-to-end manejable.
- **Patrones que se asentaron y reutilizamos en B/C:**
  - **`useTransaction` es el patrón canónico de write.** Toda acción on-chain pasa por él: dispara loading toast, espera receipt, devuelve `receipt | null`. Si retorna null la UI no avanza (no `router.push`, no refresh). Capa B va a llamarlo decenas de veces — la API estabilizó.
  - **El form "guard-then-form" — manejar primero los no-happy paths.** RoleRequestForm tiene 4 estados pre-form (no-injected / not-connected / wrong-network indirecto vía `disabled` / already-has-role). Sólo cuando todo está OK aparece el form. Esto se repite literal en todos los dashboards de Capa B.
  - **`useRoleRequests` es el patrón para "queue derivada de logs"**. `queryFilter([requested, approved, rejected])` ordenado cronológicamente y reducido a un `Map<key, request>` por (actor, role). El mismo patrón sirve para inventory queues en `/dashboard/banco` y pending screenings en `/dashboard/laboratorio` en Capa B.
  - **Logs sin block range (= "desde el génesis").** Anvil aguanta sin problema; Sepolia con muchos eventos puede pedir `fromBlock`. Phase 7 (indexer) lo resuelve definitivamente, pero como mitigación se puede pasar `fromBlock: deployBlock` cuando llegue Sepolia.
- **Trampa Next 16 detalle:** `useLocale()` en server components funciona (next-intl v4 lo exporta vía el path `react-server` automáticamente al importar de `next-intl`). Confirmado en `Hero.tsx` y `CtaSection.tsx`. No hay que importar de `next-intl/server` salvo para APIs async como `getTranslations`.
- **Smoke checklist Phase 4 Capa A** (rerun antes de Capa B):
  1. `./restart.sh` (anvil + deploy con direcciones determinísticas verificadas en Phase 3).
  2. MetaMask: importar PK#1 → conectar.
  3. Navegar `/[locale]/connect` → form aparece → pedir rol `LABORATORIO` "Test Lab" "AR" → tx confirmada (toast verde) → redirige a `/dashboard` y muestra el rol como NONE todavía (porque no aprobaron).
  4. Cambiar a PK#0 en MetaMask (admin) → `/dashboard` muestra "Sos Administrador" → entrar a `/dashboard/admin` → ver la solicitud → aprobar → toast verde.
  5. Volver a PK#1 → `/dashboard` ahora muestra `LABORATORIO` como rol activo.
- **Próximo paso (Capa B):**
  1. Empezar por `/dashboard/banco-sangre` porque inicia el lifecycle (sin donaciones no hay nada que tamizar). Form: `donorIdHash` (calcular con `keccak256(DNI + saltInstitucional)` en el cliente — UI ayuda al usuario), `volumeMl`, `aboRhCode` (ISBT 128, dropdown con 8 valores de `lib/Codes.sol`).
  2. Después `/dashboard/laboratorio` que necesita inventario de unidades `UnderTest`. La query es por logs `DonationCollected` + state read `getUnit().status`.
  3. Cada sub-dashboard reusa: `useTransaction` para writes + el patrón "guard-then-form" + un `useXxxList` hook tipo `useRoleRequests` para queues.
- **Re-leer antes de Capa B:** `docs/SDD.md` §8.3 (cada función crítica de `HemaTraceability` y su semántica), §7.2 (máquina de estados de `DonationUnit` — qué transiciones son válidas), y el ABI completo de `HemaTraceability` (events DonationCollected/TestResultRecorded/UnitReleased/UnitQuarantined/ComponentProduced/ComponentCustodyTransferred/ComponentRecalled/Transfusion/AdverseEventReported).

### Sesión 2026-05-23 — Phase 4 Capa B.1 sellada ✅ (B.2+C pendientes)
- **Tres sub-dashboards en un commit** (`68ba600`). Capa B.1 consumió **~90k** sobre los ~120k de Capa A, total Phase 4 parcial ~210k de los ~300k estimados.
- **State machine real (≠ SDD)** — el SDD §7.2 dibuja `Collected → InTransit → UnderTest`, pero el contrato salta directo `Collected → UnderTest` al llamar `recordTestResult`. No hay `transferUnitCustody`. Los dashboards reflejan el contrato, no el SDD diagram. Decisión consciente, documentada en el commit de Phase 1 (`8b3c831`).
- **Patrones que se asentaron y se reusan en B.2/C:**
  - **`useDonations(opts)` con keys stringificadas en deps** (`opts.collectionCenter` + `opts.statuses.join(",")`) — la firma del hook usa arrays/strings que no son referencias estables; convertirlas a strings antes de las deps del effect evita re-fetches infinitos. Aplicable a cualquier futuro `useComponents`, `useCertificates`, etc.
  - **`RoleGate` con orden estricto noInjected → notConnected → loading → wrong-role → wrong-network → children.** El orden importa: `loading` antes de `wrong-role` evita falsos negativos durante el primer fetch. Reusable para banco/hospital/auditor sin retoques.
  - **DNI → keccak256 preview en el form.** Mejora la confianza del usuario en que no se sube PII. Acompañado de una nota explícita sobre el salt institucional (Ley 25.326). Se replica en hospital (patient DNI → patient hash) en B.2.
  - **`splitVolumeOf` query paralela por unidad** después del fetch de unidades. La estructura `useDonations` + parallel reads (Promise.all) sirve como receta general para "lista enriquecida con datos derivados". B.2 la repite para enriquecer inventario de componentes con expiry y temp.
  - **i18n: `unitStatus` separado del namespace de cada panel.** Los status (Collected/UnderTest/Released/etc.) los traducen todos los paneles; vivían en un namespace propio para no duplicarlos. Para B.2 agregamos `componentStatus` análogo.
- **Smoke checklist B.1** (re-correrla antes de B.2):
  1. `./restart.sh` → anvil + deploy.
  2. PK#0 (admin), aprobar 3 cuentas (PK#1=BANCO_SANGRE, PK#2=LABORATORIO, PK#3=FRACCIONAMIENTO) vía `/connect` + `/dashboard/admin`.
  3. PK#1: `/dashboard/banco-sangre` → registrar 2 donaciones (DNI cualquiera, 450 ml, una A+ otra O-). Inventario debe mostrarlas como Recolectada.
  4. PK#2: `/dashboard/laboratorio` → ambas unidades aparecen en la primera cola. Cargar resultado all-negative + ABO confirmado para una; positive HCV para la otra (Chagas en true es el camino interesante regionalmente). Liberar la negativa, cuarentenar la positiva con motivo.
  5. PK#3: `/dashboard/fraccionamiento` → la liberada aparece con 450 ml disponibles. Producir RBC 200 ml → volumen restante baja a 250. Producir FFP 250 ml → restante 0. Estado del padre transiciona a Processed (visible en banco-sangre inventory).
- **Pendiente en B.2 (lifecycle tardío):**
  1. `/dashboard/banco` (inventario de componentes). Hook: `useComponents({ custodian, statuses })` análogo a `useDonations`. Query base: `ComponentProduced` events → getComponent reads → filtrar por custodian.
  2. `/dashboard/hospital` (cross-match + transfusión). Form patient DNI → hash, dropdown de componentes Produced/InStorage con custodian=msg.sender, llamada a `crossMatch`. Después, lista de Reserved con botón `recordTransfusion`.
  3. `/dashboard/auditor` (look-back + timeline). Form `reportAdverseEvent` con dropdown de `AdverseKind` (DonorPositive/RecipientReaction/EquipmentFailure) + hash del trigger (DNI donante o ID componente según kind). Lista de eventos recientes derivada de todos los events del contrato.
- **Tip operativo:** los warnings de Turbopack sobre "multiple lockfiles" se siguen mostrando pero no bloquean. Si llega a fastidiar, set `turbopack: { root: process.cwd() }` en next.config.ts (probado: funciona, pero re-ejecutar `cd web && npm run build` después).

### Sesión 2026-05-23 — Phase 4 cerrada ✅ (Capa B.2 + Capa C + 2 hotfixes)
- **Cuatro commits en esta sesión** (`bf36c56`, `9681316`, `f18a107`, `ff5a041`). Phase 4 cierra en ~310k vs. ~300k estimado.
- **Dos bugs reales del lifecycle que aparecieron en QA del usuario:**
  1. **`PositiveScreening(uint256)` invisible en MetaMask.** El selector `0x4d4c637a` venía como "Internal JSON-RPC error" porque MetaMask no decodifica custom errors. El UI mostraba el botón Liberar incluso para unidades con marcadores positivos — el contrato sólo permite cuarentena en ese caso. Fix: `ScreeningQueue` ahora hace `getTestResult` por unidad UnderTest y muestra `Todos negativos` o badges rojos por marcador, escondiendo Liberar si hay positivos.
  2. **`splitVolumeOf` mal interpretado.** Devuelve el **acumulado producido**, no el restante. La UI mostraba "Disponible: 0 ml" en unidades recién liberadas → cualquier valor positivo era "Supera el volumen restante". Fix: `remaining = parentVolume - splitVolumeOf(id)`.
- **Reglas nuevas de Next 16 que pegaron en esta tanda:**
  - **`react-hooks/purity`** rechaza `Date.now()` en render. Solución: `useState(() => Date.now())` snapshot al mount, refresh manual al apretar Refrescar. Aplicado en `ComponentInventory` y `ComponentDetailPage`.
  - **`react-hooks/set-state-in-effect`** ya nos había pegado 2 veces. Volvió a aparecer en `useUnitDetail` y `useComponentDetail`. Patrón consolidado: **derivar `isLoading` desde `(data, error, id)` en vez de trackearlo con setState**:
    ```ts
    const isLoading = data === null && error === null && id !== null;
    ```
    Cero setState en el cuerpo del effect, sólo en `.then`/`.catch`. **Es el patrón canónico** para todo data-fetching hook a futuro.
- **Patrones nuevos que se asentaron (Phase 5+ los va a reusar):**
  - **Indexed event filters.** `queryFilter(filters.X(id))` en vez de filtrar client-side. Performance significativamente mejor con muchos eventos. Usado en detail hooks.
  - **Detail page sin gate de rol.** Datos anonimizados (hashes), URLs públicas — Phase 6 `/verify/[id]` va a reusar `useUnitDetail` y `useComponentDetail` casi sin tocar.
  - **`Timeline` con `summarise()` switch-based.** Cuando llegue Phase 7 (indexer SSE), el componente queda igual; sólo cambia la fuente de los eventos.
- **Smoke checklist Phase 4 completa** (e2e en el browser, ~3 minutos):
  1. `./restart.sh` → anvil + deploy.
  2. PK#0 (admin) en `/dashboard/admin` → aprobar PK#1=BANCO_SANGRE, PK#2=LABORATORIO, PK#3=FRACCIONAMIENTO, PK#4=MEDICINA_TRANSFUSIONAL, PK#5=AUDITOR.
  3. PK#1 → `/dashboard/banco-sangre` → registrar donación (DNI cualquiera, 450ml, A+).
  4. PK#2 → `/dashboard/laboratorio` → todo negativo + ABO confirmado → Liberar.
  5. PK#3 → `/dashboard/fraccionamiento` → producir RBC 200ml, FFP 250ml. Padre pasa a Processed.
  6. PK#3 → mismo dashboard, `TransferCustodyForm` → transferir uno de los componentes a PK#4 con temp en rango (ej. 4°C para RBC).
  7. PK#4 → `/dashboard/hospital` → cross-match con DNI del paciente → component pasa a Reserved → recordTransfusion → Transfused.
  8. PK#5 → `/dashboard/auditor` → reportAdverseEvent kind=DonorPositive con DNI del donante original → look-back marca como Recalled todas las unidades/componentes derivados. Timeline muestra el `LookBackTriggered` evento.
  9. En cualquier momento: click en una unidad de `DonationList` → `/units/[id]` con timeline + componentes hijos. Click en un componente → `/components/[id]` con cadena de custodia.
- **Re-leer antes de Phase 5:** `docs/SDD.md` §4.8 (FR-19..22 — certificados NFT con IPFS), §8.4 (`HemaCertificate`), y verificar el setup de Pinata en `.env.example` (`PINATA_JWT`).
- **Próximo paso (Phase 5):** Certificates + IPFS.
  1. Crear cuenta Pinata + JWT en `.env.local`.
  2. Endpoint `/api/upload` server-side que sube PDFs a Pinata y retorna CID.
  3. UI de emisión en `/dashboard/certificador`: upload PDF → cliente computa `keccak256(file)` → llama `issueCertificate(subject, type, expiresAt, documentHash, cid)`.
  4. Page `/[locale]/certificates/[tokenId]` que renderiza el cert: lee del contrato, fetch del PDF desde IPFS, re-hashea client-side y compara con `documentHash` antes de mostrar.
  5. CTAs de revocación (`revokeCertificate`).
  6. ROLE_LANDING actualizado: `CERTIFICADOR: { path: "/dashboard/certificador" }`.


0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e


0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356