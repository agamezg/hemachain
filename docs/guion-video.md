# Guión del video demo — HemaChain (Loom, ≤ 5 min, español)

> Objetivo: cumplir la rúbrica del TFM (demo práctica + innovaciones vs esqueleto + on-chain). Estructura alineada a las "Instrucciones Generales de Entrega" §3.3.
>
> **Son talking points, no para leer.** Hacé, no expliques teoría. Objetivo de duración: **~4:30**.

## Antes de grabar (checklist)
- [ ] `SEED=1 ./restart.sh` corriendo (anvil + datos demo + web :3000 + indexer :4000). **Ojo: `SEED=1`, no el `./restart.sh` pelado** — el seed trae look-back, excursión térmica y cert revocada, que son los beats del video.
- [ ] MetaMask en `http://localhost:8545`, chainId 31337, cuenta **Banco (#1)** importada.
- [ ] **Terminal con `forge test` ya corrido** (110/110 en verde), scrolleado al resumen — para mostrarlo 5 s, **no** correrlo en vivo.
- [x] Beat de IA — **`ANTHROPIC_API_KEY` ya cargada** en `web/.env.local` → el agente in-app "Ask HemaChain" responde **en vivo** (acordate de reiniciar el dev tras cargarla). _Alternativa gratis si preferís:_ Claude Code/Desktop con el MCP `hemachain` (ver `docs/MCP.md`).
- [x] **Sepolia deployado y verificado** — dejá abierta una pestaña de Etherscan con un contrato verificado (links en la sección de abajo).
- [ ] Pestañas: `localhost:3000/es`, el diagrama de arquitectura (README §4 / SDD §6), y la pestaña de **Etherscan** del contrato verificado en Sepolia.
- [ ] Cerrar notificaciones que distraigan. Micrófono probado. Timer de Loom a la vista. Ensayo 1 vez.

## Enlaces de Etherscan (Sepolia) — tener abiertos

> Desplegados y verificados (chain `11155111`, 2026-05-27). Para el video, **mostrá la pestaña "Contract" con el check verde "Verified"** — el más vistoso es `HemaTraceability` (el contrato grande, con todo el ciclo de vida).

| Qué mostrar                                             | Enlace                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **`HemaTraceability`** ★ (recomendado — núcleo)         | `https://sepolia.etherscan.io/address/0x7b92DcD02c6F04b5FA3937d7769586D44F5D2953#code` |
| `HemaRegistry`                                          | `https://sepolia.etherscan.io/address/0xFfFeD3c8d864D1A5c39F7BA1292a2162ED616ecF#code` |
| `HemaCertificate` (ERC-721)                             | `https://sepolia.etherscan.io/address/0xADc6C4731c318a1CD5C5fAccFE8EAE6CdaEE791E#code` |
| Wallet de deploy (muestra las 3 creaciones de contrato) | `https://sepolia.etherscan.io/address/0xa49aA91a06a58c9D29Ac1314626aD51314004947`      |

---

## 0:00 – 0:30 · Introducción
**Mostrar:** landing `localhost:3000/es`.

> "Hola, soy Ariel. Esto es **HemaChain**: trazabilidad de donaciones de sangre sobre Ethereum, anclada en la **Resolución 536/2026** del Ministerio de Salud argentino, que obliga a informatizar la trazabilidad en todos los centros de hemoterapia.
> El esqueleto del máster proponía una cadena genérica Productor→Fábrica→Retailer. Yo lo llevé a un **vertical regulado real**: look-back automático, cadena de frío con enforcement on-chain, certificados NFT y verificación pública sin wallet."

## 0:30 – 1:25 · Arquitectura, tests y multilenguaje
**Mostrar:** diagrama Mermaid (README §4) → terminal con `forge test` verde → un clic en el switch de idioma.

> "Tres contratos en **Solidity/Foundry**: `HemaRegistry` (roles), `HemaTraceability` (ciclo de vida) y `HemaCertificate` (NFTs ERC-721). Frontend **Next.js 16 + React 19**. Off-chain: un **indexador** Node con WebSocket + SQLite que emite por **SSE** para alertas en vivo, y un **MCP server** que expone la cadena a Claude.
> **Privacidad por diseño**: on-chain sólo hay hashes irreversibles — ningún dato personal del donante o paciente. Eso es el cumplimiento de la Ley 25.326."

*(mostrar terminal)* > "Y no es una maqueta: **110 tests en Foundry**, incluidas las 7 invariantes del diseño."

*(clic en el switch es → en, vuelve a es)* > "Multilenguaje desde el día uno —español, portugués e inglés— pensado para apertura MERCOSUR."

## 1:25 – 4:10 · Demostración práctica
> **4 beats con aire.** Si una tx tarda, narrá mientras carga; nunca silencio.

**Beat 1 (≈40 s) · On-chain + indexador en vivo — el momento clave.**
- MetaMask en **Banco (#1)** → `/es/dashboard/banco-sangre` → registrar donación (DNI cualquiera → se ve el hash, 450 ml, A+) → firmar.

> "Registro una donación como Banco de Sangre. El DNI se convierte en **hash** antes de tocar la cadena. Al confirmarse…" *(aparece el toast "en vivo")* "…el indexador la detecta por WebSocket y la empuja al dashboard en tiempo real."

**Beat 2 (≈50 s) · Verificación pública — linaje + cadena de frío + look-back.**
- Abrir `localhost:3000/verify/c1` **sin wallet conectada**. *(Puente: "ahora una unidad que ya recorrió todo el pipeline.")*

> "Esta es la página pública que apunta el **QR impreso en la bolsa**: sin wallet, sin login. Acá está el **árbol de linaje**, el **timeline** de trazabilidad y la **cadena de frío** — este componente tuvo una excursión térmica y el contrato lo marcó *Recalled* solo. Y por el **look-back**: cuando el auditor reportó al donante como positivo, todos los componentes derivados quedaron retirados en bloque, atómicamente."

**Beat 3 (≈25 s) · Certificado NFT + verificación de hash.**
- Abrir `/es/certificates/2`.

> "Los certificados de acreditación son NFTs ERC-721. El PDF se ancla en IPFS y su hash queda comprometido on-chain; el navegador re-calcula el hash del PDF y lo compara. Este está **revocado**, con su motivo."

**Beat 4 (≈35 s) · IA / lenguaje natural — agente in-app en vivo.**
- Abrir el panel flotante **"Ask HemaChain"** (botón abajo a la derecha en cualquier dashboard) → preguntar *"¿cuántos glóbulos rojos vencen en las próximas 48 horas?"* → responde leyendo la cadena con tool-use.
  > "Embebí un agente en el dashboard: le pregunto en lenguaje natural y consulta el estado on-chain con tool-use para responder. La key ya está cargada, así que esto corre en vivo."
- _Plan B si la API falla en cámara (rate limit, red):_ Claude Code con el MCP `hemachain` → pedir el linaje de la unidad 1 → resumen Markdown. Misma innovación, sin depender de la API.

**(Opcional, ≈15 s) · On-chain real en Sepolia.** ✅ Ya deployado y verificado.
- Pestaña de **Etherscan** (`HemaTraceability#code`) → mostrar la pestaña **Contract** con el ✓ verde "Verified".
  > "Y no queda sólo en local: los tres contratos están **desplegados y verificados en Sepolia**. Acá ven el código fuente público y el bytecode confirmado en la red."

## 4:10 – 5:00 · Conclusiones
**Mostrar:** volver a la landing / sección innovaciones.

> "En resumen: partí de un esqueleto genérico y construí una **implementación de referencia** para un sector regulado real — look-back automático, cadena de frío con enforcement on-chain, verificación pública por QR, certificados NFT, indexador en vivo, MCP server y agente IA, en tres idiomas. La visión es que sea semilla para la adopción del Sistema Nacional de Sangre bajo la Res. 536/2026. Gracias."

---

## Notas de producción
- **No leas** el guión en cámara; son talking points.
- Si vas justo de tiempo, el orden para recortar es: (1) el beat de Sepolia/Etherscan (ya queda en README + screenshot 07), (2) comprimir el cert. **No recortes el agente IA ni el look-back** — son los diferenciadores.
- **Demo interactiva sobre Anvil, no Sepolia.** La demo en vivo (registrar, verificar, etc.) corre sobre **Anvil + seed** porque es instantánea y gratis; Sepolia se usa sólo para el beat de "esto está on-chain de verdad" (contratos verificados). Es lo normal y no resta nada.
- **El beat IA in-app ya está en vivo** (key cargada). Probalo en el ensayo: si la API tira rate-limit o se cuelga, tenés el Plan B por MCP (Claude Code) listo. El costo del uso en el video son centavos.
- **Transacciones visibles en Etherscan:** hoy las únicas son las **3 creaciones de contrato** (visibles en la wallet de deploy `0xa49a…4947`). Si querés mostrar txs de negocio en Etherscan, hacé 1–2 acciones manuales en Sepolia con la cuenta del deployer (tiene ~0.08 ETH) — opcional, no imprescindible.
