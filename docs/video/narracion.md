# Narración por segmento — para TTS

> Pegá cada bloque en tu motor de TTS (ElevenLabs / OpenAI / Azure) y exportá un `.mp3`
> con el nombre indicado dentro de `docs/video/audio/`. El texto está pensado para voz
> **neutra/rioplatense**, ritmo pausado (~150 palabras/min). Las duraciones son objetivo,
> no exactas — el script de ensamblado usa la longitud real de cada audio.
>
> Voz recomendada en ElevenLabs: un preset multilingüe en español. Velocidad normal,
> estabilidad ~50%, sin SSML (el texto ya está puntuado para respiraciones).

---

## Bloque de diapositivas (intro + arquitectura)

### `audio/01-intro.mp3` — slide 1 · ~14 s
> Hola. Esto es HemaChain: trazabilidad de donaciones de sangre sobre Ethereum, el trabajo final de mi máster en blockchain.

### `audio/02-problema.mp3` — slide 2 · ~16 s
> Hoy los registros de sangre están fragmentados entre bancos, laboratorios y hospitales. La Resolución 536 del 2026 del Ministerio de Salud argentino obliga a informatizar la trazabilidad en todos los centros. HemaChain es una implementación de referencia de esa exigencia.

### `audio/03-arquitectura.mp3` — slide 3 · ~22 s
> La arquitectura son tres contratos en Solidity con Foundry: uno gestiona los roles de cada institución, otro el ciclo de vida completo de la donación, y un tercero emite los certificados como NFT. El frontend es Next.js con React. Y por fuera de la cadena, un indexador en tiempo real y un servidor MCP que expone el estado on-chain a Claude.

### `audio/04-privacidad-tests.mp3` — slide 4 · ~18 s
> La privacidad es estructural: on-chain sólo viajan hashes irreversibles, nunca un dato personal del donante o del paciente. Eso cumple la Ley 25.326. Y no es una maqueta: hay ciento diez tests en Foundry, incluidas las siete invariantes del diseño.

### `audio/05-multilenguaje.mp3` — slide 5 · ~15 s
> Está en tres idiomas desde el día uno: español, portugués e inglés, pensado para la apertura al MERCOSUR.

---

## Bloque demo (sobre la grabación de pantalla)

> Generá estos cuatro como mp3 y, para sincronizar, **grabá la pantalla mientras los
> reproducís** y vas ejecutando cada acción. Así la grabación ya queda con la voz y la
> duración correctas. (Alternativa: armarlos en un editor tipo CapCut sobre la grabación.)

### `audio/06-demo-intro.mp3` — title card "Demo en vivo" · ~6 s
> Vamos a la demo en vivo, corriendo en local con datos de prueba.

### `audio/07-beat1.mp3` — registro + indexador · ~38 s
> Entro como Banco de Sangre y registro una donación. Fijate que el documento del donante se convierte en un hash antes de tocar la cadena. Al confirmarse la transacción… aparece este aviso en vivo: el indexador la detectó por WebSocket y la empujó al dashboard en tiempo real, sin recargar la página.

### `audio/08-beat2.mp3` — verificación pública · ~48 s
> Ahora abro la página pública de verificación, sin wallet y sin login: es la que apunta el QR impreso en la bolsa de sangre. Acá está el árbol de linaje, el timeline de trazabilidad y la cadena de frío. Este componente tuvo una excursión de temperatura y el contrato lo marcó como retirado, solo. Y por el look-back: cuando el auditor reportó al donante como positivo, todos los componentes derivados quedaron retirados en bloque, de forma atómica.

### `audio/09-beat3.mp3` — certificado NFT · ~24 s
> Los certificados de acreditación son NFT. El PDF se ancla en IPFS y su hash queda comprometido on-chain; el navegador re-calcula el hash del PDF y lo compara. Este certificado está revocado, con su motivo a la vista.

### `audio/10-beat4.mp3` — agente IA · ~32 s
> Y embebí un agente de inteligencia artificial en el dashboard. Le pregunto, en lenguaje natural, cuántos glóbulos rojos vencen en las próximas cuarenta y ocho horas. El agente consulta el estado on-chain con tool-use y me responde leyendo la cadena de verdad.

### `audio/11-sepolia.mp3` — Etherscan · ~15 s
> Y esto no queda sólo en local: los tres contratos están desplegados y verificados en Sepolia. Acá ven el código fuente público confirmado en la red.

---

## Bloque de cierre (diapositivas)

### `audio/12-innovaciones.mp3` — slide 7 · ~24 s
> En resumen, partí de un esqueleto genérico y construí algo para un sector regulado real: look-back automático, cadena de frío con enforcement on-chain, verificación pública por QR, certificados NFT, indexador en vivo, servidor MCP y agente de IA, en tres idiomas.

### `audio/13-cierre.mp3` — slide 8 · ~16 s
> La visión es que sirva de semilla para la adopción del Sistema Nacional de Sangre bajo la Resolución 536. Gracias.
