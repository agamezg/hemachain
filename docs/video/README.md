# Video demo — paquete de producción (híbrido)

Arma el video del TFM **sin que narres vos**: diapositivas con voz IA para intro y
cierre, tu grabación de pantalla real para la demo, y la misma voz IA encima. Mantiene
la **demo práctica en vivo** que pide la rúbrica.

```
docs/video/
├── deck.md          ← diapositivas (Marp markdown)
├── narracion.md     ← texto por segmento, listo para pegar en un TTS
├── subtitulos.srt   ← subtítulos (borrador, ajustables)
├── ensamblar.sh     ← arma el .mp4 final con ffmpeg
├── slides/          ← (se genera) PNG de cada diapositiva
├── audio/           ← (lo generás vos) un .mp3 por bloque de narración
└── demo.mp4         ← (lo grabás vos) la demo en pantalla, con su audio
```

> ⚠️ **Claude/Anthropic no genera audio ni video.** Este paquete produce todo el
> material editorial (slides, guion, subtítulos, script de mezcla); la **voz** la hace
> un TTS externo y la **grabación** la hacés vos. El ensamblado final es ffmpeg.

---

## Requisitos

- **ffmpeg** — `sudo pacman -S ffmpeg` (Arch) / `brew install ffmpeg` (macOS).
- **Node** (ya lo tenés) — `marp-cli` se baja solo vía `npx`.
- Un **TTS** para la voz. Opciones:
  - **ElevenLabs** (recomendado, mejor español; free tier limitado) — elevenlabs.io
  - **OpenAI TTS** / **Azure** / **Google Cloud TTS**
  - **macOS `say`** (gratis, robótico): `say -v Mónica -o audio/01-intro.aiff "texto"` y convertir a mp3.

---

## Pasos

### 1. Generá la voz (TTS)
Abrí `narracion.md`. Por cada bloque, pegá el texto en tu TTS y exportá un `.mp3` con el
nombre indicado dentro de `audio/` (ej. `audio/01-intro.mp3`). Son 13 archivos.

### 2. Grabá la demo
Levantá el stack con datos demo y grabá la pantalla siguiendo los 4 beats del guion
(`../guion-video.md`):

```bash
SEED=1 ./restart.sh        # desde la raíz del repo
```

Para sincronizar la voz: **reproducí `audio/07-beat1.mp3` … `audio/11-sepolia.mp3`
mientras ejecutás cada acción y grabás**. Guardá el resultado como `docs/video/demo.mp4`
(con su pista de audio). Herramientas de grabación: OBS, o el grabador del SO.

> Si preferís más control, grabá la demo en silencio y montá los audios 07–11 encima en
> un editor (CapCut, Descript, Shotcut). En ese caso `demo.mp4` igual debe tener una
> pista de audio (aunque sea la voz ya pegada).

### 3. Ensamblá
```bash
cd docs/video
./ensamblar.sh
```
Sale `hemachain-video.mp4` (~4:48, 1920×1080). El script renderiza las slides, arma un
clip por (slide + audio), normaliza tu `demo.mp4` y concatena todo en orden.

### 4. (Opcional) Subtítulos
`subtitulos.srt` es un borrador con tiempos aproximados. Los del bloque demo dependen de
tu grabación — ajustalos en el editor o cargá el `.srt` en Loom/YouTube y corregí. Para
quemarlos en el video: `ffmpeg -i hemachain-video.mp4 -vf subtitles=subtitulos.srt salida.mp4`.

### 5. Publicá
Subí a Loom/YouTube con permiso **"cualquiera con el enlace"** y poné el link en el
**README §10**.

---

## Editar el contenido
- **Texto de slides** → `deck.md` (Marp: cada `---` es una slide nueva).
- **Narración** → `narracion.md`; si cambiás la cantidad/orden, actualizá la tabla
  `SEGMENTS` en `ensamblar.sh`.
- **Previsualizar el deck** en vivo: `npx @marp-team/marp-cli deck.md --preview`.
- **Exportar el deck a PDF** (por si querés sólo slides): `npx @marp-team/marp-cli deck.md --pdf`.
