#!/usr/bin/env bash
# ensamblar.sh — arma el video híbrido de HemaChain a partir de:
#   - deck.md            → diapositivas (vía marp-cli)
#   - audio/*.mp3        → narración TTS (la generás vos, ver narracion.md)
#   - demo.mp4           → tu grabación de pantalla de la demo (con su audio)
#
# Salida: hemachain-video.mp4 (1920x1080, 30fps, H.264/AAC).
#
# Requisitos: ffmpeg, y node/npx para marp-cli (se baja solo con npx).
#
# Uso:
#   1) Generá los mp3 de audio/ (ver narracion.md).
#   2) Grabá la demo mientras reproducís audio/07..11 y guardala como demo.mp4.
#   3) ./ensamblar.sh
#
# El orden de los segmentos está en la tabla SEGMENTS de abajo; editala si
# cambiás el deck o la narración.

set -euo pipefail
cd "$(dirname "$0")"

SLIDES_DIR="slides"
AUDIO_DIR="audio"
WORK="build"
OUT="hemachain-video.mp4"

# Parámetros comunes de encode — TODOS los segmentos se normalizan a esto para
# que el concat sea fiable (intermedios en MPEG-TS).
VF="scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p"
AAC="-c:a aac -b:a 192k -ar 48000 -ac 2"

# Tabla ordenada de segmentos:  "tipo|imagen_o_video|audio"
#   slide|<png>|<mp3>   → diapositiva fija con narración
#   video|<mp4>|-       → metraje grabado (ya trae su propio audio)
SEGMENTS=(
  "slide|$SLIDES_DIR/slide.001.png|$AUDIO_DIR/01-intro.mp3"
  "slide|$SLIDES_DIR/slide.002.png|$AUDIO_DIR/02-problema.mp3"
  "slide|$SLIDES_DIR/slide.003.png|$AUDIO_DIR/03-arquitectura.mp3"
  "slide|$SLIDES_DIR/slide.004.png|$AUDIO_DIR/04-privacidad-tests.mp3"
  "slide|$SLIDES_DIR/slide.005.png|$AUDIO_DIR/05-multilenguaje.mp3"
  "slide|$SLIDES_DIR/slide.006.png|$AUDIO_DIR/06-demo-intro.mp3"
  "video|demo.mp4|-"
  "slide|$SLIDES_DIR/slide.007.png|$AUDIO_DIR/12-innovaciones.mp3"
  "slide|$SLIDES_DIR/slide.008.png|$AUDIO_DIR/13-cierre.mp3"
)

# ── 0. Chequeos ──────────────────────────────────────────────────────
command -v ffmpeg >/dev/null || { echo "✖ Falta ffmpeg."; exit 1; }

# ── 1. Render del deck → PNG ─────────────────────────────────────────
echo "→ Renderizando diapositivas con marp-cli..."
mkdir -p "$SLIDES_DIR" "$WORK"
npx --yes @marp-team/marp-cli@latest deck.md --images png --image-scale 2 \
  --allow-local-files -o "$SLIDES_DIR/slide.png"

# ── 2. Construir cada segmento como MPEG-TS uniforme ─────────────────
rm -f "$WORK"/seg_*.ts
i=0
concat_list=""
for entry in "${SEGMENTS[@]}"; do
  IFS='|' read -r kind src aud <<< "$entry"
  i=$((i+1))
  seg="$WORK/seg_$(printf '%02d' "$i").ts"

  if [ "$kind" = "slide" ]; then
    [ -f "$src" ] || { echo "✖ Falta diapositiva $src (¿corrió marp?)"; exit 1; }
    [ -f "$aud" ] || { echo "✖ Falta audio $aud — generalo según narracion.md"; exit 1; }
    echo "  • slide  $(basename "$src") + $(basename "$aud")"
    ffmpeg -y -loglevel error -loop 1 -i "$src" -i "$aud" \
      -vf "$VF" -c:v libx264 -preset medium -tune stillimage \
      $AAC -shortest -f mpegts "$seg"
  else
    [ -f "$src" ] || { echo "✖ Falta tu grabación $src — grabá la demo y guardala así."; exit 1; }
    echo "  • video  $(basename "$src") (metraje grabado)"
    ffmpeg -y -loglevel error -i "$src" \
      -vf "$VF" -c:v libx264 -preset medium \
      $AAC -f mpegts "$seg"
  fi
  concat_list+="${concat_list:+|}$seg"
done

# ── 3. Concatenar ────────────────────────────────────────────────────
echo "→ Concatenando $(echo "$concat_list" | tr '|' '\n' | wc -l) segmentos..."
ffmpeg -y -loglevel error -i "concat:$concat_list" -c copy -bsf:a aac_adtstoasc "$OUT"

dur=$(ffprobe -v error -show_entries format=duration -of default=nk=1:nw=1 "$OUT" 2>/dev/null || echo "?")
echo ""
echo "✓ Listo: $OUT  (~${dur%.*} s)"
echo "  Subtítulos opcionales: subtitulos.srt (ajustá los tiempos del bloque demo a tu grabación)."
