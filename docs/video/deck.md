---
marp: true
theme: default
paginate: true
size: 16:9
backgroundColor: #0f172a
color: #e2e8f0
style: |
  section {
    font-family: 'Inter', system-ui, sans-serif;
    padding: 60px 80px;
  }
  h1 { color: #ffffff; font-size: 56px; }
  h2 { color: #60a5fa; font-size: 40px; }
  strong { color: #f87171; }
  .accent { color: #22c55e; }
  code { background: #1e293b; color: #93c5fd; padding: 2px 8px; border-radius: 6px; }
  ul { font-size: 30px; line-height: 1.5; }
  .small { font-size: 22px; color: #94a3b8; }
  section.title { justify-content: center; text-align: center; }
  section.demo { justify-content: center; text-align: center; background: #111827; }
---

<!-- _class: title -->

# 🩸 HemaChain

## Trazabilidad de donaciones de sangre **on-chain**

<span class="small">TFM — Máster en Blockchain · CodeCrypto Academy 2026 · Ariel</span>

---

## El problema → la norma

- Registros de sangre **fragmentados** entre bancos, laboratorios y hospitales.
- Look-back manual, cadena de frío opaca, certificados falsificables.
- **Resolución 536/2026** del Ministerio de Salud argentino: obliga a **informatizar la trazabilidad** en todos los centros de hemoterapia.

<span class="small">HemaChain es una implementación de referencia de esa exigencia.</span>

---

## Arquitectura

- **3 contratos en Solidity / Foundry**
  - `HemaRegistry` — roles por institución
  - `HemaTraceability` — ciclo de vida donación → transfusión
  - `HemaCertificate` — certificados **NFT ERC-721**
- **Frontend** Next.js 16 + React 19
- **Off-chain**: indexador Node (WebSocket + SQLite + **SSE**) y un **MCP server** que expone la cadena a Claude

---

## Privacidad por diseño · y probado

- On-chain **sólo hashes irreversibles** — ningún dato personal del donante o paciente.
- Cumplimiento de la **Ley 25.326** de protección de datos.
- <span class="accent">**110 tests en Foundry**</span>, incluidas las **7 invariantes** del diseño (volumen conservado, recall propaga, cadena de frío, monotonía de certificados…).

---

## Multilenguaje · MERCOSUR

- Español 🇦🇷 · Português 🇧🇷 · English 🇬🇧
- Externalizado desde el día uno con `next-intl`.
- Pensado para apertura regional (MERCOSUR) y audiencia internacional.

---

<!-- _class: demo -->

# ▶ Demo en vivo

<span class="small">Registro · indexador en tiempo real · verificación pública por QR · certificado NFT · agente IA</span>

---

## Innovaciones vs. el esqueleto

- Vertical **regulado real** (sangre), no genérico
- **Look-back automático** on-chain (recall atómico)
- **Cadena de frío** con enforcement on-chain
- **Verificación pública** por QR, sin wallet
- Certificados **NFT** + verificación de hash del PDF
- **Indexador en vivo**, **MCP server** y **agente IA**

---

<!-- _class: title -->

## Desplegado y verificado en **Sepolia**

<span class="small">

`HemaRegistry` · `HemaTraceability` · `HemaCertificate`
código fuente verificado en Etherscan

</span>

# Gracias 🩸

<span class="small">Semilla de referencia para el Sistema Nacional de Sangre — Res. 536/2026</span>
