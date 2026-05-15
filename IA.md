# IA.md — Retrospectiva del uso de Inteligencia Artificial

> **Proyecto:** HemaChain — Trazabilidad de donaciones de sangre y certificaciones sobre Ethereum
> **Autor:** Ariel — Máster en Blockchain, CodeCrypto Academy (2026)
> **Estado:** WIP — se actualiza al cierre de cada Phase. **Última entrada:** Phase 0.

Este documento responde a los cuatro ítems exigidos por el README oficial del TFM:

1. IAs utilizadas
2. Tiempo aproximado consumido, separando smart contract y frontend
3. Errores más habituales detectados en los chats con IA
4. Archivos de los chats con la IA

Más una quinta sección con el **valor real agregado** por la IA y la implementación del **MCP** (bonus +5 % según el rúbrica).

---

## 1. IAs utilizadas

| Herramienta | Modelo / versión | Propósito principal | Modo de uso |
|---|---|---|---|
| **Claude Code** | `claude-opus-4-7` | Agente principal de desarrollo end-to-end | CLI interactiva (este mismo entorno) |
| **Claude API** | `claude-opus-4-7` + tool-use | Agente "Ask HemaChain" embebido en la dApp (Phase 7) | API + MCP |
| **ChatGPT** | GPT-4o / GPT-5 (cuando aplique) | Validación cruzada de marco regulatorio, consultas puntuales sobre estándares ISBT 128 | UI de chat |
| **GitHub Copilot** | (uso casual, si aplica) | Autocompletado en VS Code | IDE |

### Por qué Claude Code como agente principal
- Capacidad de ejecutar comandos shell, leer/escribir archivos y mantener contexto largo en una sola sesión.
- Plan mode para diseño antes de implementación (usado para producir el SDD inicial).
- Manejo nativo de MCP, lo que permitió integrar el agente "Ask HemaChain" sin glue code adicional en Phase 7.
- Memoria persistente entre sesiones (`~/.claude/projects/...`), útil para retomar.

---

## 2. Tiempo aproximado por fase

> Se irá completando al final de cada Phase. Las cifras son horas-persona efectivas (no horas de calendario).

| Phase | Componente | Horas estimadas | Horas reales |
|---|---|:-:|:-:|
| 0 | Planificación + SDD + documentación inicial | — | **~2 h** |
| 1 | Smart contracts (Foundry, TDD) | 12 h | — |
| 2 | Frontend scaffold + design system | 6 h | — |
| 3 | Web3 wiring | 3 h | — |
| 4 | Core pages (role-based) | 12 h | — |
| 5 | Certificates + IPFS | 4 h | — |
| 6 | Traceability + public verify | 8 h | — |
| 7 | Innovation layer (indexer, MCP, AI) | 8 h | — |
| 8 | Polish, test, i18n, deploy, record | 10 h | — |

**Distribución estimada smart contract vs frontend:** ~40 % SC, ~50 % Frontend, ~10 % infra/off-chain. Se ajustará con los datos reales.

### Detalle Phase 0 (esta sesión)
- Exploración del esqueleto del TFM y de `eth-ejercicios/` (dos agentes Explore en paralelo): ~15 min.
- Investigación regulatoria argentina (búsquedas web sobre Ley 22.990, Res. 865/2006, Res. 536/2026, ISBT 128, hemovigilancia): ~20 min.
- Iteración del plan con el usuario (industria, scope, testnet, idiomas, regulación argentina vs europea): ~30 min.
- Escritura del plan inicial en `~/.claude/plans/`: ~15 min.
- Diagnóstico y resolución del bloqueo de Ultraplan (auth GitHub, remote rename): ~20 min.
- Escritura de los 4 documentos (`README.md`, `docs/SDD.md`, `docs/TRACK.md`, `IA.md`): ~30 min.

---

## 3. Errores más habituales detectados en chats con IA

> Sección que se enriquece a medida que avanza la implementación. Las entradas iniciales reflejan el conocimiento previo del autor sobre patrones de error frecuentes con LLMs en desarrollo blockchain.

### 3.1. Errores observados en Phase 0

| # | Categoría | Descripción | Mitigación |
|---|---|---|---|
| 1 | Confusión de marco regulatorio | El primer plan asumió EU 2002/98/EC como ancla principal cuando el autor reside en Argentina. La corrección la introdujo el autor, no la IA. | Lección: al inicio de un proyecto regulado, **declarar la jurisdicción explícitamente**. Esto se incorporó como ítem en el guion de futuras sesiones. |
| 2 | Asunción tácita sobre el remote git | Ultraplan asumió GitHub como remote por defecto; el repo de la academia está en GitLab self-hosted. La IA no anticipó el escenario y propuso un fix sólo después del primer error. | Al iniciar tareas de CI/CD o herramientas remotas, verificar primero `git remote -v`. |
| 3 | Asunción sobre disponibilidad de `gh` CLI | La IA propuso instalar `gh` vía `sudo pacman` sin verificar si `sudo` funcionaba en el shell de Claude Code (no tiene TTY). | Antes de proponer comandos `sudo`, comprobar si están permitidos en el entorno; ofrecer alternativas web/UI desde el primer intento. |

### 3.2. Errores frecuentes esperables en Phases 1–8

Sección que se irá rellenando con observaciones reales.

| Categoría esperada | Por qué es probable | Cómo lo voy a documentar |
|---|---|---|
| Alucinación de funciones inexistentes (OZ, ethers v6) | LLMs entrenados con mezcla de v4/v5 de OpenZeppelin y de ethers v5/v6 | Capturar la "firma alucinada" + la firma real |
| Confusión Foundry vs Hardhat | El esqueleto pide Foundry; la IA a veces sugiere Hardhat por sesgo de entrenamiento | Forzar contexto Foundry en cada prompt de SC |
| `forge test` falla por path/imports incorrectos | Pre-/0.8.20 vs post-/0.8.20 difieren en `remappings` | Documentar `remappings.txt` desde Phase 1 |
| Confusión Solidity 0.8.20 vs 0.8.24 (PUSH0) | Sepolia soporta PUSH0; algunas redes alternativas no | Fijar pragma 0.8.24 + EVM `cancun` |
| Race conditions React 19 + ethers v6 | API de Next.js 15 + ethers v6 cambió respecto a v5 | Capturar snippets correctos en Phase 3 |
| Estado de tx perdido en re-renders | El frontend pierde el estado de "pending" si no se persiste | Patrón con `useReducer` + localStorage |
| i18n: keys faltantes en producción | next-intl falla silenciosamente si una key no existe en el archivo del locale | Linter + smoke test al final de Phase 8 |

---

## 4. Archivos de los chats con la IA

> Se irán enlazando los transcripts a medida que cada Phase concluya.

| Phase | Tema principal | Archivo | Resumen |
|---|---|---|---|
| 0 | Planificación inicial + SDD | `docs/chats/phase-0-plan.md` *(pendiente de export)* | Conversación que produjo el plan en `~/.claude/plans/imperative-juggling-candy.md` y los 4 docs iniciales |
| 1 | Smart contracts | `docs/chats/phase-1-sc.md` | (pendiente) |
| 2 | Frontend design system | `docs/chats/phase-2-frontend.md` | (pendiente) |
| 3 | Web3 wiring | `docs/chats/phase-3-web3.md` | (pendiente) |
| 4 | Core pages | `docs/chats/phase-4-pages.md` | (pendiente) |
| 5 | Certificates + IPFS | `docs/chats/phase-5-certs.md` | (pendiente) |
| 6 | Traceability + public verify | `docs/chats/phase-6-trace.md` | (pendiente) |
| 7 | Innovation (indexer + MCP + AI) | `docs/chats/phase-7-innov.md` | (pendiente) |
| 8 | Polish + i18n + video | `docs/chats/phase-8-polish.md` | (pendiente) |

> El plan completo y firmado por la IA queda persistido en `~/.claude/plans/imperative-juggling-candy.md` (fuera del repo) y resumido en este `docs/SDD.md`.

---

## 5. Valor real agregado por la IA

Sección graded — el rúbrica penaliza el copy-paste y premia el uso de IA con valor demostrable.

### 5.1. Lo que la IA hizo bien (Phase 0)

- **Investigación regulatoria veloz**: la IA ejecutó búsquedas web paralelas sobre Ley 22.990, Res. 865/2006, Res. 536/2026, ISBT 128 e hemovigilancia, sintetizó los hallazgos y los integró en el SDD en un orden de magnitud menos tiempo que una búsqueda manual.
- **Diseño de invariantes formales**: las 7 invariantes (`INV_VolumeConserved`, `INV_RecallPropagates`, etc.) emergieron del diálogo, no copiadas de literatura — el autor verificó cada una contra la práctica médica antes de incorporarla.
- **Mapeo del esqueleto del TFM al vertical de sangre**: la tabla de §1 del README (`Industrial pattern → Blood donation analogue`) es una contribución original que demuestra comprensión real del dominio.
- **Estructura de tests**: la matriz de tests (unit / invariant / fuzz / gas snapshot / e2e) y los nombres específicos surgieron de la IA pero el autor valida cada uno antes de codificarlo.

### 5.2. Lo que el autor (no la IA) decidió

- **Industria**: blood donations en lugar de las 5 verticales documentadas.
- **Marco regulatorio**: pivote de europeo a argentino tras corrección explícita.
- **Idiomas**: tres locales (es/pt/en), no propuesto inicialmente por la IA.
- **Visión de adopción estatal**: incorporada por el autor como narrativa de cierre del video.
- **Alcance de los componentes off-chain**: el indexador, el MCP server y el agente IA estaban en el "Maximum scope" pero el autor confirmó la inversión de tiempo.

### 5.3. Cómo evitar el copy-paste evaluador-penalizado

- **Cada línea de Solidity** la implementa el autor entendiendo qué hace; la IA propone, el autor revisa, prueba y corrige.
- **Cada decisión de diseño** queda documentada en el SDD con razón explícita.
- **El video demuestra dominio** — el autor explica en español por qué cada componente está, no recita el plan.
- **`IA.md` (este archivo)** es transparente sobre qué hizo la IA y qué no.

---

## 6. MCP — Model Context Protocol

> Bonus +5 % en el rúbrica. Implementación detallada en Phase 7 — esta sección documenta el alcance.

### 6.1. Qué es

MCP es un protocolo estándar de Anthropic para que LLMs interactúen con sistemas externos vía "tools" tipadas. HemaChain incluye un **MCP Server propio** que envuelve la CLI de Foundry y expone consultas de trazabilidad.

### 6.2. Herramientas expuestas

```
mcp_anvil_start(port: int = 8545) -> { rpcUrl: string, pid: int }
mcp_anvil_reset() -> { resetAt: number }
mcp_forge_test(matchTest?: string, verbosity: int = 2) -> { passed: int, failed: int, gas: object }
mcp_forge_deploy(network: "anvil" | "sepolia") -> { addresses: { registry, traceability, certificate } }
mcp_forge_script(scriptPath: string, args: string[]) -> { txHashes: string[], logs: string[] }
mcp_cast_call(target: address, function: string, args: any[]) -> { result: any }
mcp_trace_query(unitOrComponentId: number) -> {
  unit: { id, status, donorHash, ... },
  components: [...],
  custody: [...],
  certificates: [...]
}
```

### 6.3. Casos de uso del agente IA usando MCP

- *"Reseteá Anvil y volvé a desplegar"* → `mcp_anvil_reset()` + `mcp_forge_deploy("anvil")`
- *"Mostrame todos los componentes derivados del donante con hash 0x…"* → `mcp_cast_call(...)` indirecto via lectura de events
- *"¿Cuántos GR expiran en 48 horas?"* → `mcp_trace_query` agrega + filtra
- *"Corré los tests de la suite de look-back"* → `mcp_forge_test(matchTest="LookBack")`

### 6.4. Documentación adicional

Detalles de implementación y deployment del MCP Server en `docs/MCP.md` (Phase 7).

---

## 7. Reflexión final (a completar en Phase 8)

Espacio para el cierre del proyecto: qué aprendí del trabajo con la IA, dónde fue una buena pareja y dónde no, cómo lo encararía distinto en un próximo proyecto. Se redacta al cierre.
