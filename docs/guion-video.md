# Guión del video demo — HemaChain (Loom, ≤ 5 min, español)

> Objetivo: cumplir la rúbrica del TFM (demo práctica + innovaciones vs esqueleto + on-chain). Estructura alineada a las "Instrucciones Generales de Entrega" §3.3.
>
> **Son talking points, no para leer.** Hacé, no expliques teoría. Objetivo de duración: **~4:30**.

## Antes de grabar (checklist)
- [ ] `SEED=1 ./restart.sh` corriendo (anvil + datos demo + web :3000 + indexer :4000). **Ojo: `SEED=1`, no el `./restart.sh` pelado** — el seed trae look-back, excursión térmica y cert revocada, que son los beats del video.
- [ ] MetaMask en `http://localhost:8545`, chainId 31337, cuenta **Banco (#1)** importada.
- [ ] **Terminal con `forge test` ya corrido** (110/110 en verde), scrolleado al resumen — para mostrarlo 5 s, **no** correrlo en vivo.
- [ ] Beat de IA — elegí UNO y dejalo listo:
  - **Gratis:** Claude Code/Desktop con el MCP `hemachain` registrado (ver `docs/MCP.md`).
  - **Con créditos (~US$5, uso = centavos):** `ANTHROPIC_API_KEY` en `web/.env.local` + dev reiniciado → agente "Ask HemaChain" en vivo.
- [ ] Pestañas: `localhost:3000/es`, el diagrama de arquitectura (README §4 / SDD §6), y **—sólo si ya deployaste—** una pestaña de Etherscan con el contrato verificado en Sepolia.
- [ ] Cerrar notificaciones que distraigan. Micrófono probado. Timer de Loom a la vista. Ensayo 1 vez.

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

**Beat 4 (≈35 s) · IA / lenguaje natural — elegí la variante que preparaste.**
- **Variante in-app (con `ANTHROPIC_API_KEY`):** abrir el panel flotante **"Ask HemaChain"** → preguntar *"¿cuántos glóbulos rojos vencen en las próximas 48 horas?"* → responde leyendo la cadena.
  > "Embebí un agente en el dashboard: le pregunto en lenguaje natural y consulta el estado on-chain con tool-use para responder."
- **Variante MCP (gratis, Claude Code):** mostrar Claude con el MCP `hemachain` → pedir el linaje de la unidad 1 → devuelve el resumen Markdown.
  > "Expongo la cadena por un **MCP server** propio: le pido a Claude el linaje de una unidad y me lo resume."

**(Opcional, ≈15 s) · On-chain real en Sepolia.**
- *Si ya deployaste:* pestaña de **Etherscan** → "los contratos están **desplegados y verificados en Sepolia** — acá el código fuente y las transacciones públicas."
- *Si todavía no:* una frase → "los contratos están desplegados y verificados en Sepolia; los enlaces de Etherscan están en el README §6." *(asegurate de que sea verdad antes de entregar.)*

## 4:10 – 5:00 · Conclusiones
**Mostrar:** volver a la landing / sección innovaciones.

> "En resumen: partí de un esqueleto genérico y construí una **implementación de referencia** para un sector regulado real — look-back automático, cadena de frío con enforcement on-chain, verificación pública por QR, certificados NFT, indexador en vivo, MCP server y agente IA, en tres idiomas. La visión es que sea semilla para la adopción del Sistema Nacional de Sangre bajo la Res. 536/2026. Gracias."

---

## Notas de producción
- **No leas** el guión en cámara; son talking points.
- Si vas justo de tiempo, el orden para recortar es: (1) el beat de Sepolia/Etherscan (ya queda en README + screenshot 07), (2) comprimir el cert. **No recortes el agente IA ni el look-back** — son los diferenciadores.
- **Camino de grabación sin Sepolia:** podés grabar hoy entero sobre **Anvil + seed**; el deploy a Sepolia es un entregable del repo (README §6 + screenshot Etherscan), no necesita estar *en* el video. Sólo no filmes el beat de Etherscan hasta tenerlo deployado.
- **Costo del beat IA in-app:** la API de Claude es pago (mínimo ~US$5 de crédito; el uso del video son centavos). Si no querés cargar crédito, usá la **variante MCP por Claude Code**, que es gratis y cubre igual la innovación.
- **Seed en Sepolia:** `Seed.s.sol` usa claves de Anvil para los roles, sin ETH en Sepolia. Por eso la demo *interactiva* va sobre Anvil; Sepolia se usa sólo para mostrar los contratos verificados. Si querés transacciones visibles en Etherscan, hacé 1–2 acciones manuales en Sepolia con la cuenta del deployer.
