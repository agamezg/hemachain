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
> **Última actualización:** Phase 2 completa — frontend Next.js 16.2.6 con App Router localizado (`/[locale]/`, es/pt/en), next-intl 4.12 (proxy.ts middleware + messages + getRequestConfig), design system Tailwind v4 (tokens SDD §9.5), 6 componentes UI base, header sticky + footer, landing con 5 secciones, lint + build verdes (`67da936`).

---

## Resumen ejecutivo del estado

| Fase | Estado | DoD alcanzada | Tokens estim. | Tokens reales |
|---|---|:-:|---:|---:|
| 0 — Setup, SDD, scaffolding | ✅ Completa | Sí (`forge build` y `npm run build` verdes; documentación inicial escrita; ambos remotes pusheados) | ~120k | ~180k† |
| 1 — Smart contracts | ✅ Completa | Sí (`forge test` 110/110 verdes; invariantes + fuzz; Deploy/Seed smoke-tested en Anvil; gas snapshot capturado) | ~400k | ~550k† |
| 2 — Frontend scaffold & design system | ✅ Completa | Sí (`npm run lint` y `npm run build` verdes; 6 páginas estáticas — `/_not-found`, `/es`, `/pt`, `/en` × layout — + proxy middleware; design tokens + UI lib + header/footer + landing con i18n día 1) | ~150k | ~140k |
| 3 — Web3 wiring | ⬜ No iniciada (próxima) | — | ~100k | — |
| 4 — Core pages (role-based) | ⬜ No iniciada | — | ~300k | — |
| 5 — Certificates + IPFS | ⬜ No iniciada | — | ~100k | — |
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
