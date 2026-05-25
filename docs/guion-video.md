# Guión del video demo — HemaChain (Loom, ≤ 5 min, español)

> Objetivo: cumplir la rúbrica del TFM (demo práctica + innovaciones vs esqueleto + on-chain). Estructura alineada a las "Instrucciones Generales de Entrega" §3.3.
>
> **Antes de grabar** (checklist):
> - [ ] `SEED=1 ./restart.sh` corriendo (anvil + datos demo + web :3000 + indexer :4000).
> - [ ] MetaMask en `http://localhost:8545`, chainId 31337, con la cuenta **Banco (#1)** importada.
> - [ ] Pestañas abiertas: `localhost:3000/es`, una pestaña de Etherscan con el contrato en **Sepolia** (la address verificada), y el diagrama de arquitectura (README §4 o SDD §6).
> - [ ] Cerrar pestañas/notificaciones que distraigan. Micrófono probado. Timer de Loom a la vista.
> - [ ] Ensayo 1 vez. Objetivo de duración: **~4:30**.

---

## 0:00 – 0:30 · Introducción
**Mostrar:** landing `localhost:3000/es`.

> "Hola, soy Ariel. Esto es **HemaChain**, trazabilidad de donaciones de sangre sobre Ethereum, anclada en la **Resolución 536/2026** del Ministerio de Salud argentino, que obliga a informatizar la trazabilidad en todos los centros de hemoterapia.
> El esqueleto del máster proponía una cadena genérica Productor→Fábrica→Retailer con tokens fungibles. Yo lo llevé a un **vertical regulado real**: 3 contratos, 8 roles, tamizaje obligatorio con Chagas, look-back automático, cadena de frío on-chain, certificados NFT y verificación pública."

## 0:30 – 1:30 · Arquitectura y tecnología
**Mostrar:** el diagrama Mermaid (README §4) y scroll por la landing (sección innovaciones + mapa de instituciones).

> "La arquitectura: tres smart contracts en **Solidity/Foundry** — `HemaRegistry` (roles), `HemaTraceability` (ciclo de vida) y `HemaCertificate` (NFTs ERC-721). Frontend en **Next.js 16 + React 19**, multilenguaje. Off-chain: un **indexador** Node con WebSocket + SQLite que emite eventos por **SSE** para alertas en vivo, y un **MCP server** que expone la cadena a Claude por tool-use.
> **Privacidad por diseño**: on-chain sólo hay hashes irreversibles — ningún dato personal del donante o paciente. Ese es el cumplimiento de la Ley 25.326. 110 tests en Foundry, incluidas 7 invariantes."

## 1:30 – 4:00 · Demostración práctica
**1) Toast en vivo (on-chain + indexador) — el momento clave.**
- En MetaMask elegí **Banco (#1)** → ir a `/es/dashboard/banco-sangre`.
- Registrar una donación (DNI cualquiera → se muestra el hash, 450 ml, A+). Firmar en MetaMask.

> "Registro una donación como Banco de Sangre. Fíjense que el DNI se convierte en un hash antes de tocar la cadena. Al confirmarse la transacción…" *(aparece el toast "en vivo" del indexador)* "…el indexador la detecta por WebSocket y la empuja al dashboard en tiempo real."

**2) Verificación pública (sin wallet) + look-back + cadena de frío.**
- Abrir `localhost:3000/verify/c1` (sin wallet conectada).

> "Esta es la página pública que apunta el **QR impreso en la bolsa**. Sin wallet, sin login. Acá ven el **árbol de linaje** de la donación, el **timeline** de trazabilidad, y la **cadena de frío**: este componente tuvo una excursión térmica, así que el contrato lo marcó como *Recalled* automáticamente. Y por el **look-back**, cuando el auditor reportó al donante positivo, todos los componentes derivados quedaron retirados en bloque."

**3) Certificado NFT + verificación de hash.**
- Abrir `/es/certificates/2`.

> "Los certificados de acreditación son NFTs ERC-721. El PDF se ancla en IPFS y su hash queda comprometido on-chain; el navegador re-calcula el hash del PDF y lo compara. Este está **revocado**, con su motivo."

**4) On-chain real (Sepolia).**
- Cambiar a la pestaña de **Etherscan** con el contrato verificado.

> "Y esto no es sólo local: los contratos están **desplegados y verificados en Sepolia** — acá se ve el código fuente y las transacciones públicas en Etherscan."

**5) (10s) IA / MCP — bonus.**
- Mostrar `docs/MCP.md` o un `trace_query` en Claude Desktop/Code.

> "Además expongo la cadena a Claude vía un **MCP server** propio: puedo pedirle en lenguaje natural el linaje de una unidad y me devuelve el resumen."

## 4:00 – 5:00 · Conclusiones
**Mostrar:** volver a la landing / sección innovaciones.

> "En resumen: partí de un esqueleto genérico y construí una implementación de referencia para un sector regulado real — con look-back automático, cadena de frío con enforcement on-chain, verificación pública por QR, certificados NFT, indexador en vivo y un MCP server. La visión es que esto sea semilla para la adopción del Sistema Nacional de Sangre bajo la Res. 536/2026. Gracias."

---

## Notas de producción
- **No leas** este guión en cámara; son talking points. Hacé, no expliques teoría.
- Si una tx tarda, narrá mientras carga (no te quedes en silencio).
- Vigilá el timer: si vas justo, recortá el punto 5 (IA/MCP) — ya está documentado y suma igual por el README.
- **Caveat de seed en Sepolia:** el `Seed.s.sol` usa claves de Anvil para los roles, que no tienen ETH en Sepolia. Para el video, la demo *interactiva* corre sobre Anvil (`SEED=1`); Sepolia se usa sólo para mostrar los **contratos desplegados y verificados** en Etherscan (que es lo que pide la rúbrica). Si querés transacciones visibles en Etherscan, hacé 1–2 acciones manuales en Sepolia con la cuenta del deployer.
